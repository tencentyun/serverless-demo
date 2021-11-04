import os
import logging
import datetime
import random
import uuid
import pytz
import json
import time
from qcloud_cos import CosConfig
from qcloud_cos import CosS3Client


logger = logging.getLogger()
tz = pytz.timezone('Asia/Shanghai')


def build_cos_object_key(timestamp: int, seq: str):
    tm = datetime.datetime.fromtimestamp(timestamp, tz=tz)
    dir_name = tm.strftime("data/%Y%m%d/%H")
    object_key = f'{dir_name}/{seq}.txt'
    return object_key


def iter_event_data(event_list):
    for event_item in event_list:
        tm = event_item.get("time")
        event_id = event_item.get("id")
        data = event_item.get("data")
        if (tm is None) or (data is None) or (event_id is None):
            print("ignore: error event format. %s" % str(event_item))
            continue
        date_text = json.dumps(data)
        yield int(tm), event_id, date_text


def main_handler(event, context):
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

    rand = str(random.random())[2:]
    now = int(time.time())
    seq_str = f"{now}.{rand}"
    cos_object_key = build_cos_object_key(now, seq_str)
    data = ""
    for event_time, event_id, data_text in iter_event_data(event_list):
        line = f"{event_time}\t{event_id}\t{data_text}\n"
        data += line
    resp = cos_client.put_object(bucket_upload, data, cos_object_key,
                          Metadata={
                              "x-cos-meta-seq": seq_str
                          })
    print("put_object resp=", resp)
    return "ok"
