#!/usr/bin/env python3
# -*- coding: utf8 -*-

import os
import json
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk

es_address = os.getenv("ES_IP_ADDRESS", "127.0.0.1")  # 多个ip用逗号分隔
es_port = os.getenv("ES_PORT", "9200")
es_user = os.getenv("ES_USERNAME")
es_pswd = os.getenv("ES_PASSWORD")
es_index_name = os.getenv("ES_INDEX_NAME")

iplist = es_address.split(",")

es = Elasticsearch(iplist, port=es_port, http_auth=(es_user, es_pswd))


def gen_index(events):
    for event in events:
        data = event.get("data")
        if not data:
            print("error, 'data' not found. %s" % str(event))
            continue
        data['_index'] = es_index_name
        yield data


def main_handler(event, context):
    # print("Received event: " + json.dumps(event, indent=4))
    # print("Received context: " + str(context))
    event_list = []
    if "EventList" in event:  # 批量投递
        event_list = event["EventList"]
    else:
        event_list.append(event)
    if not event_list:
        return "error, empty event"
    bulk(es, gen_index(event_list))
    return 'ok'
