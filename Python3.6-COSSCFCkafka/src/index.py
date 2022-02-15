#!/usr/bin/env python
# -*- coding=utf-8

import os
import logging
from cos_to_kafka import CosToKafka

logger = logging.getLogger('Index')
logger.setLevel(logging.INFO)

def main_handler(event, context):
    logger.info("start main handler")
    kafka_address = os.getenv("kafka_address")
    kafka_topic_name = os.getenv("kafka_topic_name")

    cos_to_kafka = CosToKafka(
        kafka_address,
        # security_protocol = "PLAINTEXT",
        #sasl_mechanism = "PLAIN",
        #sasl_plain_username = "ckafka-80o10xxx#lkoxx",
        #sasl_plain_password = "kongllxxxx",
        api_version=(1, 1, 1)
    )

    ret = cos_to_kafka.send(kafka_topic_name, event)
    logger.info(ret)
    return ret