# -*- coding: utf-8 -*-

import sys
import logging

print('Loading function')

logger = logging.getLogger()

def main_handler(event, context):
    logger.info("start main handler")

    print(event)

    body = 'API GW Test Success'

    response = {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
        "body": body
    }

    return response