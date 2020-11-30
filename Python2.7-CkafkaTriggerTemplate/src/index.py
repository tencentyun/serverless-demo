# -*- coding: utf8 -*-
import logging

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


def main_handler(event, context):
    for record in event["Records"]:
        logger.info("msg: %s", record["Ckafka"]["msgBody"])
    return "hello from scf"
