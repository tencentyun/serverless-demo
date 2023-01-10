#!/usr/bin/env python
# -*- coding=utf-8

import os
import logging
from cos_to_kafka import CosToKafka

logger = logging.getLogger('Index')
logger.setLevel(logging.INFO)

kafka_address = os.getenv("kafka_address")
kafka_topic_name = os.getenv("kafka_topic_name")

def main_handler(event, context):
    cos_to_kafka = CosToKafka(
        kafka_address,
        api_version=(1, 1, 1)
    )
    logger.info("start main handler")
    ret = cos_to_kafka.send(kafka_topic_name, event)
    logger.info(ret)
    cos_to_kafka.close()
    return ret