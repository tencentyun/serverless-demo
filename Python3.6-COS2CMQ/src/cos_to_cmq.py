#!/usr/bin/env python
# -*- coding=utf-
import os
import time
import logging
from cmq.account import Account
from cmq.queue import QueueMeta, Message
from cmq.cmq_exception import CMQExceptionBase


class CosToCmq:
    def __init__(self, endpoint, secret_id, secret_key, queue_name):
        self.cmq_account = Account(endpoint, secret_id, secret_key)
        self.cmq_queue = self.cmq_account.get_queue(queue_name)

        # 日志配置
        self.logger = logging.getLogger('COSToCmq')
        self.logger.setLevel(logging.INFO)

    def send(self, event):
        s_time = time.time()

        count = 0
        try:
            if "Records" in event:
                event_list = event["Records"]
                for data in event_list:
                    value = data["cos"]
                    msg = Message(value)
                    re_msg = self.cmq_queue.send_message(msg)
                    self.logger.info("Send Message Succeed! MessageBody:%s MessageID:%s" % (msg.msgBody, re_msg.msgId))
                    count = count + 1

        except CMQExceptionBase as e:
            self.logger.info("Send Message Fail! Exception:%s\n" % e)
            raise e

        e_time = time.time()

        return "{} messages delivered in {}s".format(count, e_time - s_time)
