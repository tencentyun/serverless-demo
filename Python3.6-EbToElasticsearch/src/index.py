#!/usr/bin/env python3
# -*- coding: utf8 -*-

import os
import json
from elasticsearch import Elasticsearch


es_address = os.getenv("ES_IP_ADDRESS", "127.0.0.1")
es_port = os.getenv("ES_PORT", "9200")
es_user = os.getenv("ES_USERNAME")
es_pswd = os.getenv("ES_PASSWORD")

ES_INDEX_NAME = "index_eb_demo"
iplist = es_address.split(",")

es = Elasticsearch(iplist, port=es_port, http_auth=(es_user, es_pswd))


def write_to_es(doc):
    resp = es.index(index=ES_INDEX_NAME, body=doc)
    print("es resp:", resp)


def main_handler(event, context):
    print("Received event: " + json.dumps(event, indent=4))
    print("Received context: " + str(context))

    # 期望处理  eb连接器转发的kafka消息
    e_source = event.get("source")
    e_type = event.get("type")
    if e_source != "ckafka.cloud.tencent":
        return "error source"
    if e_type != "connector:ckafka":
        return "error type"

    msg_body = event["data"]["msgBody"]
    # topic = event["data"]["topic"]
    write_to_es(msg_body)
    return 'ok'
