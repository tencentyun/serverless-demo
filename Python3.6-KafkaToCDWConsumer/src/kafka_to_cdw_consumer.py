# -*- coding: utf8 -*-
import os
import time
import logging

from cdw_client import CDWClient
from kafka_consumer import KafkaConsumer

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

## 各种系统常量，以下常量均可通过同名环境变量进行覆盖
MAX_CONSUME_COUNT = 50000  #每次消费的最大条数，注意该参数并非越大越好
MSG_SEPARATOR = ',' #kafka中消息的分隔符
CONSUMER_TIMEOUT_MS = 3000 #读取kafka的超时时间，单位毫秒
DB_PORT = 5436 #CDW的端口，默认应该是5436
OFFSET_TYPE = 'latest' #  消费kafka数据的位移，[latest,earliest]

def init_kafka_consumer(group_id, partition_id):
    kafka_address = os.getenv("KAFKA_ADDRESS")
    topic_name = os.getenv("TOPIC_NAME")
    offset_type = os.getenv("OFFSET_TYPE", OFFSET_TYPE)
    consumer_timeout_ms = os.getenv("CONSUMER_TIMEOUT_MS", CONSUMER_TIMEOUT_MS)

    kafka_consumer = KafkaConsumer(topic_name, kafka_address, int(partition_id), group_id, offset_type, int(consumer_timeout_ms))
    return kafka_consumer

def init_cdw_client():
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_DATABASE")
    port = os.getenv("DB_PORT", DB_PORT)
    
    cdw_client = CDWClient(host, user, password, int(port), database)
    return cdw_client

def check_param():
    if os.getenv("KAFKA_ADDRESS") is None:
        logger.error("need environment variable KAFKA_ADDRESS")
        return False
    if os.getenv("DB_DATABASE") is None:
        logger.error("need environment variable DB_DATABASE")
        return False
    if os.getenv("DB_HOST") is None:
        logger.error("need environment variable DB_HOST")
        return False
    if os.getenv("DB_USER") is None:
        logger.error("need environment variable DB_USER")
        return False
    if os.getenv("DB_PASSWORD") is None:
        logger.error("need environment variable DB_PASSWORD")
        return False
    if os.getenv("DB_SCHEMA") is None:
        logger.error("need environment variable DB_SCHEMA")
        return False
    if os.getenv("DB_TABLE") is None:
        logger.error("need environment variable DB_TABLE")
        return False
    if os.getenv("TOPIC_NAME") is None:
        logger.error("need environment variable TOPIC_NAME")
        return False    

    return True

def main_handler(event, context):
    # 检查必要的环境变量是否设置
    ret = check_param()
    if ret == False:
        return "done"

    # 初始化
    kafka_consumer = init_kafka_consumer(context["function_name"], event["partition_id"])
    cdw_client = init_cdw_client()

    # 消费kafka数据
    max_consume_count = os.getenv("MAX_CONSUME_COUNT", MAX_CONSUME_COUNT)
    kafka_consumer.consume(int(max_consume_count))
    if kafka_consumer.msg_consumed_count <= 0:
        logger.info("skip copy cause no msg consumed")
        return "done"

    # 将数据copy到cdw中
    schema = os.getenv("DB_SCHEMA")
    table = os.getenv("DB_TABLE")
        
    msg_separator = os.getenv("MSG_SEPARATOR", MSG_SEPARATOR)
    ret = cdw_client.copy_from(kafka_consumer.sio, schema+"."+table, msg_separator)
    if ret:
        # copy是一个事务，要么全部成功，要么全部失败，copy成功之后再提交kafka，避免漏数据
        kafka_consumer.commit()

    return "done"


if __name__ == "__main__":
    main_handler(None, None)