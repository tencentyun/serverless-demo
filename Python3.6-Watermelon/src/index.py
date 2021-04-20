#!/usr/bin/env python
# -*- coding:utf-8 -*-

#####----------------------------------------------------------------#####
#####                                                                #####
#####   使用教程/readme:                                              #####
#####   https://cloud.tencent.com/document/product/583/32996         #####
#####                                                                #####
#####----------------------------------------------------------------#####

def main_handler(event, context):
    f = open("./index.html")
    html = f.read()
    return {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {'Content-Type': 'text/html'},
        "body": html
    }
