#!/usr/bin/python
# -*- coding: UTF-8 -*-
from datetime import datetime
from kafka import KafkaProducer
from kafka.errors import KafkaError

Servers = "10.100.112.15:9092"  # 修改为Ckafka内网IP 地址+端口 E.g. 10.100.112.15:9092
Topic = "kafka2es" # 修改为 Ckafka Topic 名称 E.g. kafka2es

producer = KafkaProducer(bootstrap_servers=[Servers])

# Ckafka 循环导入
def main_handler(event, context):
    for record in event["Records"]: # 获取 event Records 字段，数据结构 https://cloud.tencent.com/document/product/583/17530 
        producer.send(Topic,record["Ckafka"]["msgBody"])
        # Key，value 传递，更多介绍 https://kafka-python.readthedocs.io/en/master/usage.html#kafkaproducer
        # producer.send(Topic, key=record["Ckafka"]["msgBody"], value=record["Ckafka"]["msgKey"])
    # Debug ：
    def on_send_error(excp):
        log.error('errback', exc_info=excp)
    # 输出结果
    return("successful!")