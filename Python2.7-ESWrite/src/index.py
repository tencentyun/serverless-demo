# -*- coding: utf8 -*-
from datetime import datetime
from elasticsearch import Elasticsearch
import random

ESServer = Elasticsearch("10.16.16.10:9200")

def cron_es_write():
    #index_prefix = "cron-"
    write_data = {}
    write_data["timestamp"] = datetime.now().strftime( "%Y-%m-%dT%H:%M:%S.000+0800" )
    write_data["randomcode"] = random.randint(1,100)
    ESServer.index(index="cron_write", doc_type='doc', body=write_data)


def main_handler(event,context):
    cron_es_write()
