#!/usr/bin/env python
# -*- coding: utf8 -*-


import re


def main_handler(event, context):
    """
    CKafka Connector 传递过来的 event 结构如下：
    {
        "event": {
            "data": [
                msg1,
                msg2,
                msg3
            ]
        }

    }
    在这里，测试数据结构为：
    {
        "event": {
            "data": [
                "13911112222",
                "13122223333",
                "2345678"
            ]
        }
    }
    """
    print('start main_handler')
    num = len(event['event']['data'])
    print('the length of msg body is [%s]'%num)  
    messages = []  
    for message in event['event']['data']:
        pattern = re.compile(r'^1[3|4|5|7|8][0-9]{9}$', re.I)
        searchObj = pattern.match(message)  # 判断是否是合法手机号，如果不是，则不进行处理
        if searchObj:
            # 对手机号进行脱敏，将中间的四位数字换成星号
            message = re.sub(r"(\d{3})\d{4}(\d{4})", r"\1****\2", message)
        else:
            print('[%s] is not a valid phone number'%message)  
        messages.append(message)
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
                "13911112222",
                "13122223333",
                "2345678"
            ]
        }
    }
    result = main_handler(event, {})
    print(result)
