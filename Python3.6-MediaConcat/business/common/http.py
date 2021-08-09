# -*- coding: utf8 -*-

import requests


# 成功响应
def response(task_id, request_id):
    resp = {
        'TaskID': task_id,
        'RequestID': request_id
    }
    return resp


# 错误响应
def err_resp(code, message, request_id):
    resp = {
        'ErrorCode': code,
        'ErrorMessage': message,
        'RequestID': request_id
    }
    return resp


def build_callback(file_id, media_url, cover_url, task_id, request_id, vod_request_id):
    date = {
        "Result": "Failure",
        "ErrorCode": "InvalidParam",
        "ErrorMessage": "Media URLs are missing",
        "TaskID": task_id,
        "RequestId": request_id,
        "VodRequestId": vod_request_id
    }
    if file_id and media_url:
        date = {
            "Result": "Success",
            "FileId": file_id,
            "MediaUrl": media_url,
            "CoverUrl": cover_url,
            "TaskID": task_id,
            "RequestId": request_id,
            "VodRequestId": vod_request_id
        }

    return date


# 回调逻辑。
def callback(url, data):
    if not url:
        print("callback url is empty, no need to callback.")
        return

    response = requests.post(url, json=data)
    print("callback response:", response.text.encode('utf8'))