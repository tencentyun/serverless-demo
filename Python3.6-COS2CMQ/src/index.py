#!/usr/bin/env python
# -*- coding=utf-8

import os
import logging
from cos_to_cmq import CosToCmq

logger = logging.getLogger('Index')
logger.setLevel(logging.INFO)


def main_handler(event, context):
    logger.info("start main handler")
    secret_id = os.getenv("secretID")
    secret_key = os.getenv("secretKey")
    cmq_endpoint = os.getenv("cmq_endpoint")
    cmq_queue_name = os.getenv("cmq_queue_name")

    cos_to_cmq = CosToCmq(
        cmq_endpoint,
        secret_id,
        secret_key,
        cmq_queue_name,
    )

    ret = cos_to_cmq.send(event)

    return ret
