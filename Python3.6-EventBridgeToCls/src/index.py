# -*- coding: utf-8 -*-
import os

from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.cls.v20201016.cls_client import ClsClient
import cls_kv_pb2


class LogTooLargeException(Exception):
    pass


def build_log_group_list(event_list: list) -> (cls_kv_pb2.LogGroupList, int):
    """
    将event列表转化为cls所需的LogGroupList
    :param event_list:
    :return: （转换后的LogGroupList， 里面包含的event数量）
    """
    log_group_list = cls_kv_pb2.LogGroupList()
    log_group = log_group_list.logGroupList.add()
    event_count = 0
    for event in event_list:
        event_id = event.get("id")
        event_time = event.get("time")
        data = event.get("data")
        if (not data) or (not isinstance(data, dict)):
            print("'data' is empty, or type!=dict")
            continue
        log = log_group.logs.add()
        log.time = event_time

        content = log.contents.add()
        content.key = "event_id"
        content.value = event_id

        for key, value in data.items():
            content = log.contents.add()
            content.key = key
            content.value = str(value)
        event_count += 1
    return log_group_list, event_count


def predict_event_size(event):
    log_group_list, _ = build_log_group_list([event, ])
    data = log_group_list.SerializeToString()
    return len(data)


def upload_event(cls_client, cls_topic_id, event_list) -> int:
    if len(event_list) > 10000:
        raise LogTooLargeException("event长度超过了10000")
    log_group_list, event_count = build_log_group_list(event_list)
    if event_count == 0:
        print("build_log_group_list event_count==0, ignore")
        return event_count
    data = log_group_list.SerializeToString()
    if len(data) > 5*1024*1024:
        raise LogTooLargeException("data长度超过了5M")
    headers = {
        "X-CLS-TopicId": cls_topic_id,
    }
    try:
        resp = cls_client.call_octet_stream("UploadLog", headers, data)
        print("UploadLog resp: %s" % resp)
        return event_count
    except TencentCloudSDKException as err:
        if err.code == "LimitExceeded.LogSize":     # 针对单条log过大
            raise LogTooLargeException(err)
        if err.code == "RequestSizeLimitExceeded":  # 针对请求体过大
            raise LogTooLargeException(err)
        raise err


def split_group(event_list):
    result = []
    tmp_group, tmp_group_size = [], 0

    for event in event_list:
        size = predict_event_size(event)
        if size >= 1024*1024:    # Value must be less than 1M.  单条log不能超过1M
            print("ignore size>1M. ", event)
            continue
        # 总请求不能超过5M 或 1w条
        size_greater_than_5m = (tmp_group_size + size) > 4 * 1024 * 1024   # 4M. 因为无法精确计算一组event序列化之后的长度，所以留一点冗余
        item_greater_than_1w = len(tmp_group) > 10000
        if size_greater_than_5m or item_greater_than_1w:
            result.append(tmp_group)
            tmp_group, tmp_group_size = [], 0
        tmp_group.append(event)
        tmp_group_size += size
    if len(tmp_group) > 0:
        result.append(tmp_group)
    return result


def main_handler(event, context):
    # print("Received event: " + json.dumps(event))
    # print("Received context: " + str(context))
    secret_id = os.getenv("TENCENTCLOUD_SECRETID")
    secret_key = os.getenv("TENCENTCLOUD_SECRETKEY")
    session_token = os.getenv("TENCENTCLOUD_SESSIONTOKEN")
    cls_topic_id = os.getenv("CLS_TOPIC_ID")
    cls_region = os.getenv("CLS_REGION")
    cred = credential.Credential(secret_id, secret_key, token=session_token)
    cls_client = ClsClient(cred, cls_region)

    event_list = []
    if "EventList" in event:  # 批量投递
        event_list = event["EventList"]
    else:
        event_list.append(event)
    if not event_list:
        return "error, empty event"

    groups = split_group(event_list)

    for group in groups:
        ret = upload_event(cls_client, cls_topic_id, group)
        print("upload_event success=%d total=%d" % (ret, len(group)))
