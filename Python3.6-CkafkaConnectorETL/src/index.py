#!/usr/bin/env python
# -*- coding: utf8 -*-


import base64
import json
import re
import time


def main_handler(event, context):
    """
    CKafka Connector 传递过来的 event 结构如下：
    {
        "event": {
            "data": [
                msg1,
                msg2,
            ]
        }

    }
    在这里，测试数据结构为：
    {
        "event": {
            "data": [
                '{"a": "Anny", "b": 21, "c": "13111111111", "d": "Y2xvdWQudGVuY2VudC5jb20vcHJvZHVjdC9zY2Y=\\n"}',
                '{"a": "Ernest", "b": 22, "c": "13111112222", "d": "Y2xvdWQudGVuY2VudC5jb20vcHJvZHVjdC9zY2Y=\\n"}',
            ]
        }
    }
    其中，每一条数据都是 json string，包含的信息是用户的基础资料，分别是“姓名”、“年龄”、“手机号码”、“最喜欢的云产品”。
    下面将数据的 key 正确还原，以及对手机号进行脱敏，对喜欢的云产品 URL 进行 base64 decode。
    最后，每一条记录都增加一个字段，记录当前处理的时间。
    """
    print('start main_handler')
    num = len(event['event']['data'])
    print('the length of msg body is [%s]'%num)  
    messages = []  
    for message in event['event']['data']:
        # 将 json string 解析成字典 
        message = json.loads(message)
        new_message = {}
        # a -> name
        new_message['name'] = message['a']
        # b -> age
        new_message['age'] = message['b']
        # c -> phone, 手机号码进行脱敏，‘13111112222’ -> ‘131****2222’
        new_message['phone'] = re.sub(r"(\d{3})\d{4}(\d{4})", r"\1****\2", message['c'])
        # d -> product, URL 进行 decodde
        new_message['product'] = base64.decodebytes(message['d'].encode()).decode()
        new_message['time'] = time.time()
        messages.append(new_message)
    result = {
        'result': 'Succeed',
        'data': messages
    }
    # 如果处理失败，可封装错误消息体：
    # {"result": "Failed"}
    return result


if __name__ == '__main__':
    event = {
        "event": {
            "data": [
                '{"a": "Anny", "b": 21, "c": "13111111111", "d": "Y2xvdWQudGVuY2VudC5jb20vcHJvZHVjdC9zY2Y=\\n"}',
                '{"a": "Ernest", "b": 22, "c": "13111112222", "d": "Y2xvdWQudGVuY2VudC5jb20vcHJvZHVjdC9zY2Y=\\n"}',
            ]
        }
    }
    result = main_handler(event, {})
    print(result)
