# -*- coding: utf8 -*-
from datetime import datetime
from elasticsearch import Elasticsearch
import curator

esServer = "10.16.16.137:9200"  # 修改为 es server 地址+端口
esPrefix = "cron-"              # 查找的 index 索引前缀
esCuratorTimeStr = "%Y%m%d%H"   # 索引中的时间格式
esCuratorTimeUnit = "hours"     # 过滤清理的时间单位,days,months
esCuratorTimeCount = 8          # 时间间隔

# 如上示例可以清理 索引格式类似为 index-2018101113 ，当前时间的8个小时前的索引

ESServer = Elasticsearch(esServer)

def clean_index():
    ilo = curator.IndexList(ESServer)
    ilo.filter_by_regex(kind='prefix', value=esPrefix)
    ilo.filter_by_age(source='name', direction='older', timestring=esCuratorTimeStr, unit=esCuratorTimeUnit, unit_count=esCuratorTimeCount)
    try:
        ilo.empty_list_check()
    except Exception,e:
        print(e)
        print("list is empty")
        return
    delete_indices = curator.DeleteIndices(ilo)
    print(delete_indices.do_action())

def main_handler(event,context):
    clean_index()

