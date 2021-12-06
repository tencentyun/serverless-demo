#!/usr/bin/env python3
# -*- coding: utf8 -*-

import os
import json
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk


def gen_index(events, es_index_name):
    print("events.len=", len(events))
    for event in events:
        data = event.get("data")
        if not data:
            print("error, 'data' not found. %s" % str(event))
            continue
        data['_index'] = es_index_name
        size = len(json.dumps(data))
        if size >= 32766:
            print("event 大于32k， 忽略. size=", size)
            continue
        yield data


def main_handler(event, context):
    es_address = os.getenv("ES_IP_ADDRESS", "127.0.0.1")  # 多个ip用逗号分隔
    es_port = os.getenv("ES_PORT", "9200")
    es_user = os.getenv("ES_USERNAME")
    es_pswd = os.getenv("ES_PASSWORD")
    es_index_name = os.getenv("ES_INDEX_NAME")

    if not es_index_name:
        raise ValueError("ES_INDEX_NAME is empty")
    if not es_index_name.islower():
        raise ValueError("ES_INDEX_NAME must be lowercase")

    print("Received event: " + json.dumps(event, indent=4))
    print("Received context: " + str(context))
    event_list = []
    if "EventList" in event:  # 批量投递
        event_list = event["EventList"]
    else:
        event_list.append(event)
    if not event_list:
        return "error, empty event"

    iplist = es_address.split(",")
    if es_user and es_pswd:
        auth_info = (es_user, es_pswd)
    else:
        auth_info = None
    es = Elasticsearch(iplist, port=es_port, http_auth=auth_info)

    bulk(es, gen_index(event_list, es_index_name))
    return 'ok'
