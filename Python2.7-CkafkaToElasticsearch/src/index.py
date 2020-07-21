#!/usr/bin/python
# -*- coding: UTF-8 -*-
from datetime import datetime
from elasticsearch import Elasticsearch
from elasticsearch import helpers

esServer = "http://172.16.16.53:9200"  # 修改为 es server 地址+端口 E.g. http://172.16.16.53:9200
esUsr = "elastic" # 修改为 es 用户名 E.g. elastic
esPw = "PW123" # 修改为 es 密码 E.g. PW2312321321
esIndex = "pre1"  # es 的 index 设置

# ... or specify common parameters as kwargs
es = Elasticsearch([esServer],
      http_auth=(esUsr, esPw),
          sniff_on_start=False,
          sniff_on_connection_fail=False,
          sniffer_timeout=None)

def timer(func):
    def wrapper(*args, **kwargs):
        start = time.time()
        res = func(*args, **kwargs)
        print('共耗时约 {:.2f} 秒'.format(time.time() - start))
        return res

    return wrapper

def main_handler(event, context):
    action = ({      
        "_index": esIndex,
        "_source": {
            "msgBody": record["Ckafka"]["msgBody"] # 获取 Ckafka 触发器 msgBody
        }
    } for record in event["Records"])  # 获取 event Records 字段 数据结构 https://cloud.tencent.com/document/product/583/17530 
    print(action)  
    helpers.bulk(es, action)
    return("successful!")