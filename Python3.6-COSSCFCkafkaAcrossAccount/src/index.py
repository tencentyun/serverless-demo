#!/usr/bin/env python
# -*- coding=utf-8

import os
import logging
from to_kafka import ToKafka
from from_cos import FromCos

logger = logging.getLogger('Index')
logger.setLevel(logging.INFO)

def main_handler(event, context):
    logger.info("start main handler")
    logger.info(event)
    appid = os.getenv("appid")  #环境变量设置 appid
    secret_id = os.getenv("secret_id")  #环境变量设置 secret_id
    secret_key = os.getenv("secret_key") #环境变量设置 secret_key
    region =  os.getenv("region") #环境变量设置 region
    token = ''
    messages = []
    kafka_address = os.getenv("kafka_address") # 环境变量设置 kafka_address
    kafka_instanceId = os.getenv("kafka_instanceId") # 环境变量设置 kafka_instanceId
    kafka_username = os.getenv("kafka_username") # 环境变量设置 kafka_username
    kafka_password = os.getenv("kafka_password") # 环境变量设置 kafka_password

    kafka_topic_name = os.getenv("kafka_topic_name") #环境变量设置 kafka_topic_name
    from_cos = FromCos(appid,secret_id,secret_key,region,token)
    messages = from_cos.getMessage(event)

    if  messages:
        logger.info("start send message")

        to_kafka = ToKafka(
            kafka_address,
            security_protocol = "SASL_PLAINTEXT",
            sasl_mechanism = "PLAIN",
            sasl_plain_username = kafka_instanceId+"#"+kafka_username,
            sasl_plain_password = kafka_password,
            api_version=(1, 1)
        )
        ret = to_kafka.send(kafka_topic_name, messages)
        logger.info(ret)
        return "success"
    return "failed"