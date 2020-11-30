#!/usr/bin/env python
# -*- coding: utf8 -*-


import os
import json
import datetime
import time
import logging
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

#必填参数
ES_Address = os.getenv('ES_Address')
ES_User = os.getenv('ES_User')
ES_Password = os.getenv('ES_Password')

#按照天或者小时设置Index，默认按照天建立索引，如填day, hour
ES_Index_TimeFormat = "hour"

# es索引前缀关键词
ES_Index_KeyWord = "Log"

# 定义需要屏蔽的字符串, 以字典形式，如密码123456
ES_Clean_Word = {"123456"}

# 日志设置
logger = logging.getLogger()
logger.setLevel(logging.DEBUG) # 日志等级                                                      

# 构建es客户端
es = Elasticsearch([ES_Address], http_auth=(ES_User, ES_Password))

# 自定义es索引
def createIndex(ES_Index_KeyWord, ES_Index_TimeFormat):
    # 这里可以自行更改自定义索引
    if ES_Index_TimeFormat == "day":
        ES_Index_TimeFormat = "%Y-%m-%d"
    elif ES_Index_TimeFormat == "hour":
        ES_Index_TimeFormat = "%Y-%m-%d-%H"

    index = ES_Index_KeyWord + '-' + datetime.datetime.now().strftime(ES_Index_TimeFormat)
    return index

# 定制日志清洗功能,将字符串中的敏感信息替换成***
def cleanData(data):
    try:
        if isinstance(data, str):
            for word in ES_Clean_Word:
                data = data.replace(word, "***")
        return data
    except:
        logger.error("Error occured when cleanning data")
        raise

# 处理ckafka数据
def dealWithData(record):
    try:
        # 这里默认把msgBody直接存入Es，可以根据需求自定义解析
        # python2.7要解码，防止中文
        msg_body = record['Ckafka']['msgBody'].decode('utf-8')

        # 自定义index
        index_name = createIndex(ES_Index_KeyWord, ES_Index_TimeFormat)

        # 清洗功能
        msg_body = cleanData(msg_body)

        # 这里可以自定义增加需要上传es的信息
        data = {
            "_index": index_name,
            "msg_body": msg_body,
            "doc_as_upsert": True
        }
        
        yield data
    except:
        logger.error("Error occured when dealing data")
        raise

# 写入es
def writeDataToEs(records):
    for record in records:
        # 处理数据再写入
        data = dealWithData(record)
        # 写入es
        try:
            bulk(es, data)
        except:
            logger.error("Error occured when writing to es")
            raise


def main_handler(event, context):
    logger.debug("start main_handler")
    # ckafka消息的数量
    num = len(event['Records'])
    logger.debug("the length of msg body is [%s]" % num)    
    logger.debug("start writing to es")
    writeDataToEs(event['Records'])
    
    return 'success'
