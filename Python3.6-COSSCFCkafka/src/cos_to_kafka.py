#!/usr/bin/env python
# -*- coding=utf-

import logging
import time
import json
from kafka import KafkaProducer
from kafka.errors import KafkaError

logger = logging.getLogger('COSToKafka')
logger.setLevel(logging.INFO)

class CosToKafka(object):

    def __init__(self, host, **kwargs):
        self.host = host

        self.producer = KafkaProducer(
            bootstrap_servers = [self.host],
            # retries = 10,
            # max_in_flight_requests_per_connection = 1, 
            # request_timeout_ms = 30000,
            # max_block_ms = 60000,
            **kwargs
        )

    def send(self, topic, event):

        global count
        count = 0
        def on_send_success(record_metadata):
            global count
            count = count +1

        def on_send_error(excp):
            logger.error('failed to send message', exc_info = excp)

        s_time = time.time()
        
        eventList = None
        try:
            if "Records" in event:
                eventList = event["Records"]
                for data in eventList:
                    key = None
                    value = json.dumps(data).encode('utf-8')
                    self.producer.send(topic, key = key, value = value).add_callback(on_send_success).add_errback(on_send_error)
                # block until all async messages are sent
                self.producer.flush()
        except KafkaError as e:
            return e
        e_time = time.time()
        return "{} messages delivered in {}s".format(count, e_time - s_time)
    def close(self):
        if self.producer is not None:
            self.producer.flush()
            self.producer.close()