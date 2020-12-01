#!/usr/bin/env python
# -*- coding: utf8 -*-

#####----------------------------------------------------------------#####
#####                                                                #####
#####   使用教程/readme:                                              #####
#####   https://cloud.tencent.com/document/product/583/47077         #####
#####                                                                #####
#####----------------------------------------------------------------#####

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
ES_Index_KeyWord = os.getenv('ES_Index_KeyWord') #建立索引的前缀关键词，如填Log
#可选配参数
ES_Log_IgnoreWord = os.getenv('ES_Log_IgnoreWord')  #需要删除的关键词，缺省则全量写入，如填name,password
ES_Index_TimeFormat = os.getenv('ES_Index_TimeFormat') #按照天或者小时设置Index，缺省则按照天建立索引，如填hour


logger = logging.getLogger('elasticsearch')
logger.setLevel(logging.INFO)

es = Elasticsearch([ES_Address], http_auth=(ES_User, ES_Password))

if ES_Index_TimeFormat == "hour":
    ES_Index_TimeFormat = "%Y-%m-%d-%H"
else:
    ES_Index_TimeFormat = "%Y-%m-%d"

#日志清洗逻辑，可自行修改
def deallog(log):    
    if ES_Log_IgnoreWord != None:
        for key in ES_Log_IgnoreWord.split(","):
            log.pop(key, None)
    log["time"] = datetime.datetime.now().isoformat()
    return log

def gendata(records):
     for record in records:
        try:
            log = record['Ckafka']['msgBody']
            while type(log) != dict:
                log = json.loads(log)
            #可针对Ckafka中的某些关键字段进行转义或者修改
            if "message" in log.keys() and type(log['message']) == str:
                message = json.loads(log['message'])
                log.pop("message", None)
                log.update(message)
            log = deallog(log)
        except:
            print("except:",record['Ckafka']['msgBody'])
            log = {"msg_body":record['Ckafka']['msgBody']}

        log['_index'] = ES_Index_KeyWord + '-' + datetime.datetime.now().strftime(ES_Index_TimeFormat)

        if "log_id" in log.keys():
            log['_id'] = log['log_id']

        yield log

def main_handler(event, context):
    print('start main_handler')
    num = len(event['Records'])
    print('the length of msg body is [%s]'%num)    
    bulk(es, gendata(event['Records']))
    return 'success'
