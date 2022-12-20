# -*- coding: utf8 -*-
import os
import time
import logging
from io import StringIO

from cdw_client import CDWClient
from cos_client import COSClient

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

## 各种系统常量，以下常量均可通过同名环境变量进行覆盖
MSG_SEPARATOR_ASCII = 44 #kafka中消息的分隔符的ascii码，默认是逗号
MSG_NULL = '\\N' #kafka中消息的null值
DB_PORT = 5436 #CDW的端口，默认应该是5436
ENABLE_DEBUG = '0' #打开该设置，会打印debug信息，包括格式错误日志
REPLACE_0X00 = '0' #打开该设置，会替换字符串中的0x00，会有一定的额外开销
ENABLE_COS = '0' #打开该设置，会把错误记录转储到COS上
STATMENT_TIMEOUT = 50 #pg中的statement_timeout参数，默认50s

def init_cdw_client():
    host = os.getenv("DB_HOST")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_DATABASE")
    port = int(os.getenv("DB_PORT", DB_PORT))
    statment_timeout = int(os.getenv("STATMENT_TIMEOUT", STATMENT_TIMEOUT))
    
    cdw_client = CDWClient(host, user, password, port, database, statment_timeout)
    return cdw_client

def init_cos_client():
    region = os.getenv("TENCENTCLOUD_REGION")
    secret_id = os.getenv("COS_SECRET_ID")
    secret_key = os.getenv("COS_SECRET_KEY")
    bucket = os.getenv("COS_BUCKET")

    cos_client = COSClient(region, secret_id, secret_key, bucket)
    return cos_client

def upload_cos_from_buffer(sio, request_id):
    cos_client = init_cos_client()
    if cos_client.upload_buffer_file(sio, request_id) == True:
        logger.info("upload cos file success")
    else:
        logger.error("upload cos file fail") 

def check_param():
    if os.getenv("DB_DATABASE") is None:
        logger.error("need environment variable DB_DATABASE")
        raise Exception('check param fail')
    if os.getenv("DB_HOST") is None:
        logger.error("need environment variable DB_HOST")
        raise Exception('check param fail')
    if os.getenv("DB_USER") is None:
        logger.error("need environment variable DB_USER")
        raise Exception('check param fail')
    if os.getenv("DB_PASSWORD") is None:
        logger.error("need environment variable DB_PASSWORD")
        raise Exception('check param fail')
    if os.getenv("DB_SCHEMA") is None:
        logger.error("need environment variable DB_SCHEMA")
        raise Exception('check param fail')
    if os.getenv("DB_TABLE") is None:
        logger.error("need environment variable DB_TABLE")
        raise Exception('check param fail')

    # 如果配置了需要转储到COS上，则需要以下参数
    enable_cos = os.getenv("ENABLE_COS", ENABLE_COS)
    if enable_cos == '1':
        if os.getenv("COS_SECRET_ID") is None:
            logger.error("need environment variable COS_SECRET_ID")
            raise Exception('check param fail')
        if os.getenv("COS_SECRET_KEY") is None:
            logger.error("need environment variable COS_SECRET_KEY")
            raise Exception('check param fail')      
        if os.getenv("COS_BUCKET") is None:
            logger.error("need environment variable COS_BUCKET")
            raise Exception('check param fail')

    return True

def main_handler(event, context):    
    # 检查必要的环境变量是否设置
    try:
        ret = check_param()
    except Exception as e:
        return {'result': 'Failed'}
    
    # 初始化
    cdw_client = init_cdw_client()

    # 从event中获取消息
    sio = StringIO()
    msg_consumed_count = 0
    start_time = int(time.time())

    # 是否替换0x00
    replace_0x00 = os.getenv("REPLACE_0X00", REPLACE_0X00)
    for record in event["event"]["data"]:
        if replace_0x00 == '1':
            record = record.replace('\x00','')
        msg_consumed_count += 1
        sio.write(record)
        sio.write('\n')

    logger.info("get msg num: [%d] from event, cost time: [%ds]", msg_consumed_count, int(time.time()) - start_time)

    # 将数据copy到cdw中
    schema = os.getenv("DB_SCHEMA")
    table = os.getenv("DB_TABLE")
    msg_separator_ascii = int(os.getenv("MSG_SEPARATOR_ASCII", MSG_SEPARATOR_ASCII))
    msg_null = os.getenv("MSG_NULL", MSG_NULL)
    enable_debug = os.getenv("ENABLE_DEBUG", ENABLE_DEBUG)
    enable_cos = os.getenv("ENABLE_COS", ENABLE_COS)

    sio.seek(0)
    ret = cdw_client.copy_from(sio, schema+"."+table, chr(msg_separator_ascii), msg_null)
    # copy是一个事务，全部成功或者全部失败，失败后抛出异常，让平台重试
    if ret == False:
        # 如果配置cos，把这一批失败的数据都转储到cos上
        if enable_cos == '1':
            sio.seek(0)
            upload_cos_from_buffer(sio, context.get('request_id'))

        # 如果配置debug，把这一批所有读取的信息都打印出来
        if enable_debug == '1':
            logger.error("kafka msg as follow:")
            for record in event['event']['data']:
                logger.error(record)
        
        sio.close()
        return {'result': 'Failed'}
    sio.close()

    return {'result': 'Succeed'}


if __name__ == "__main__":
    main_handler(None, None)