# -*- coding: utf8 -*-
import reducer_triggered as Reducer
import datetime
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
import sys
import os

region = u'ap-beijing'         # Modify the area according to the actual situation.根据实际情况，修改地域
result_bucket = u'destmr'      # Modify the bucket name according to the actual situation.根据实际情况，修改bucket名

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

# appid = 1251762222

def reduce_caller(event, context,cos_client):
    appid = event['Records'][0]['cos']['cosBucket']['appid']
    bucket = event['Records'][0]['cos']['cosBucket']['name'] +'-'+ appid
    key = event['Records'][0]['cos']['cosObject']['key']
    key = key.replace('/' + str(appid) + '/' + event['Records'][0]['cos']['cosBucket']['name'] + '/', '', 1)
    logger.info("Key is " + key)

    res_bucket = result_bucket +'-'+ appid
    result_key = '/' + 'result_' + key.split('/')[-1]   
    return Reducer.qcloud_reducer(cos_client, bucket, key, res_bucket, result_key)

def main_handler(event, context):
    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"errorMsg": "event is not come from cos"}

    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      # Using the secterId in environment variables. 使用环境变量中的 secretId
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    # Using the secretKey in environment variables. 使用环境变量中的 secretKey
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
    config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=token,)
    cos_client = CosS3Client(config)

    start_time = datetime.datetime.now()
    res = reduce_caller(event,context,cos_client)
    end_time = datetime.datetime.now()
    print("data reducing duration: " + str((end_time-start_time).microseconds/1000) + "ms")
    if res == 0:
        return "Data reducing SUCCESS"
    else:
        return "Data reducing FAILED"   