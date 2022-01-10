#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import sys
path = "/".join([os.getcwd(), "lib"])
sys.path.append(path)
import json
import time
import pytz
import datetime
import logging
import consumer
import schedule


logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


def main_handler(event, context):
    start_time = int(time.time())
    logger.info("function start time: %s", str(datetime.datetime.fromtimestamp(start_time,
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
    logger.debug("Received event: " + json.dumps(event, indent=2))
    logger.debug("Received context: " + str(context))

    if event["Type"] == "Timer":
        return schedule.timer_handler(context)
    if event["Type"] == "ConsumeKafkaGroupByPartition":
        return consumer.consumer_worker(event, context, start_time)
    else:
        return "Unrecognized Event"


if __name__ == "__main__":
    main_handler(None, None)
