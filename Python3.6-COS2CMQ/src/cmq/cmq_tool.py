#!/usr/bin/python
# -*- coding: utf-8 -*-


import sys
import string
import types
import logging
import logging.handlers
from cmq.cmq_exception import *

METHODS = ["POST", "GET"]
PERMISSION_ACTIONS = ["setqueueattributes", "getqueueattributes", "sendmessage", "receivemessage", "deletemessage", "peekmessage", "changevisibility"]

class CMQLogger:
    @staticmethod
    def get_logger(log_name="CMQ_python_sdk", log_file="/tmp/CMQ_python_sdk.log", log_level=logging.INFO):
        logger = logging.getLogger(log_name)
        if logger.handlers == []:
            fileHandler = logging.handlers.RotatingFileHandler(log_file, maxBytes=10*1024*1024)
            formatter = logging.Formatter('[%(asctime)s] [%(name)s] [%(levelname)s] [%(filename)s:%(lineno)d] [%(thread)d] %(message)s', '%Y-%m-%d %H:%M:%S')
            fileHandler.setFormatter(formatter)
            logger.addHandler(fileHandler)
        CMQLogger.validate_loglevel(log_level)
        logger.setLevel(log_level)
        return logger

    @staticmethod
    def validate_loglevel(log_level):
        log_levels = [logging.DEBUG, logging.INFO, logging.WARNING, logging.ERROR, logging.CRITICAL]
        if log_level not in log_levels:
            raise CMQClientParameterException("LogLevelInvalid", "Bad value: '%s', expect levels: '%s'." % \
                (log_level, ','.join([str(item) for item in log_levels])))
