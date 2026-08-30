#!/usr/bin/env python
# -*- coding: utf8 -*-
import base64
import gzip
import json
import logging
import os

from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

# 必填参数
ES_ADDRESS = os.getenv('ES_ADDRESS')
ES_USER = os.getenv('ES_USER')
ES_PASSWORD = os.getenv('ES_PASSWORD')
ES_API_KEY = os.getenv('ES_API_KEY')
ES_INDEX = os.getenv('ES_INDEX')

# 日志设置
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)  # 日志等级

# 构建es客户端
# es = Elasticsearch([ES_ADDRESS], api_key=ES_API_KEY)
es = Elasticsearch([ES_ADDRESS], http_auth=(ES_USER, ES_PASSWORD))


# 写入es
def write_data_to_es(content):
    try:
        records = content['records']
        actions = []
        for record in records:
            action = {
                "_index": ES_INDEX,
                "_type": "_doc",
                "_source": record
            }
            actions.append(action)
        bulk(es, actions, index=ES_INDEX)
    except Exception as e:
        logger.error("Error occurred when writing to es", e)
        raise


def main_handler(event, context):
    logger.debug("start main_handler")
    logger.info(event)
    debase = base64.b64decode(event['clslogs']['data'])
    data = gzip.decompress(debase).decode()
    print(data)
    write_data_to_es(json.loads(data))

    return 'success'
