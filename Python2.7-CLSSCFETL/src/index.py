# -*- coding: utf8 -*-
import base64
import json
import gzip
import urllib
import os
import json
import datetime
import time
import logging
from StringIO import StringIO

# 日志设置
logger = logging.getLogger()
logger.setLevel(logging.DEBUG) # 日志等级        

# 定义需要屏蔽的字符串, 以字典形式，如密码123456
Clean_Word = {""}

# 定制日志清洗功能,将字符串中的敏感信息替换成***
def cleanData(data):
    try:
        for word in Clean_Word:
            data = data['content'].replace(word, "***")
        return data
    except:
        logger.error("Error occured when cleanning data")
        raise

# 打印处理结果
def printData(records):
    for record in records:
        # 处理数据再写入
        data = cleanData(record)
        # 打印结果
        try:
            print(data)
        except:
            logger.error("Error occured when writing")
            raise

def main_handler(event, context):
    logger.debug("start main_handler")
    event = json.loads(gzip.GzipFile(fileobj=StringIO(event['clslogs']['data'].decode('base64'))).read())
    data = json.dumps(event, indent=4, sort_keys=True)
    # CLS消息的数量
    num = len(data['records'])
    logger.debug("the length of msg body is [%s]" % num)    
    logger.debug("start writing to es")
    printData(data['records'])

    # 直接处理日志并写入临时文件方法
    # for record in event['records']:
    #     data = record['content'].replace('value2', "value2_replaced")
    #     try:
    #         write_to_file(local_path, data)
    #     except:
    #         logger.error("Error occured when writing")

    return 'success'
