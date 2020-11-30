#!/usr/bin/env python
# -*- coding:utf-8 -*-


def main_handler(event, context):
    f = open("./demo.html", encoding='utf-8')
    html = f.read()
    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {'Content-Type': 'text/html; charset=utf-8'},
        "body": html
    }
