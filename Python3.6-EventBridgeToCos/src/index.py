import os
import logging
import datetime
import random
import json
import time
import pytz
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client


logger = logging.getLogger()
tz = pytz.timezone('Asia/Shanghai')

env_max_file_size_mb = os.getenv("MAX_FILE_SIZE_MB")          # 文件超过多大就必须拆分， 单位是MB


def parse_split_setting_size(env_max_file_size):
    if not env_max_file_size:
        return None
    try:
        size_mb = int(env_max_file_size)
        if size_mb > 10000 or size_mb < 1:
            raise ValueError("文件大小错误")
        max_size_b = size_mb * 1024 * 1024
        return max_size_b
    except Exception as err:
        print(f"parse_file_size_time_limit error. env_max_file_size={env_max_file_size} ", err)
        raise err


def build_cos_object_key(timestamp: int, seq: str):
    ts_datetime = datetime.datetime.fromtimestamp(timestamp, tz=tz)
    dir_name = ts_datetime.strftime("data/%Y%m%d/%H")
    object_key = f'{dir_name}/{seq}.txt'
    return object_key


def event_to_lines(event_list) -> list:
    all_lines = []
    for event_item in event_list:
        event_time = event_item.get("time")
        event_id = event_item.get("id")
        data = event_item.get("data")
        if (event_time is None) or (data is None) or (event_id is None):
            print("ignore: error event format. %s" % str(event_item))
            continue
        data_text = json.dumps(data)
        line = f"{event_time}\t{event_id}\t{data_text}\n"
        all_lines.append(line)
    return all_lines


def split_group(event_text_list, file_size_limit: int):
    if not file_size_limit:
        if event_text_list:
            return [event_text_list, ]
        else:
            return []
    groups = []
    tmp_group = []
    tmp_group_size = 0
    for text in event_text_list:
        event_size = len(text)
        if (tmp_group_size + event_size) > file_size_limit:
            if tmp_group:
                groups.append(tmp_group)
            tmp_group, tmp_group_size = [], 0
        tmp_group.append(text)
        tmp_group_size += event_size
    if not tmp_group:
        return groups
    groups.append(tmp_group)    # 大小不足也要落盘， 不能丢失数据
    return groups


def upload_one_group(cos_client, bucket_upload, group):
    rand = str(random.random())[2:]     # 把随机数的前缀 "0." 去掉
    now = int(time.time())
    seq_str = f"{now}.{rand}"
    cos_object_key = build_cos_object_key(now, seq_str)
    body = "".join(group)
    resp = cos_client.put_object(bucket_upload, body, cos_object_key,
                                 Metadata={
                                     "x-cos-meta-seq": seq_str
                                 })
    print("put_object resp=", resp)


def main_handler(event, context):
    max_file_size_limit = parse_split_setting_size(env_max_file_size_mb)
    secret_id = os.getenv("TENCENTCLOUD_SECRETID")
    secret_key = os.getenv("TENCENTCLOUD_SECRETKEY")
    session_token = os.getenv("TENCENTCLOUD_SESSIONTOKEN")
    region = os.getenv("COS_REGION")
    bucket_upload = os.getenv("COS_BUCKET_UPLOAD")
    cos_config = CosConfig(Region=region, Secret_id=secret_id, Secret_key=secret_key, Token=session_token)
    cos_client = CosS3Client(cos_config)
    print("Received event: " + json.dumps(event))
    print("Received context: " + str(context))

    event_list = []
    if "EventList" in event:  # 批量投递
        event_list = event["EventList"]
    else:
        event_list.append(event)
    if not event_list:
        return "error, empty event"

    event_text_list = event_to_lines(event_list)    # 每个事件用一个字符串保存
    print("event_text_list len=", len(event_text_list))
    groups = split_group(event_text_list, max_file_size_limit)
    if not groups:
        return "no data"

    for group in groups:
        upload_one_group(cos_client, bucket_upload, group)

    return "ok"
