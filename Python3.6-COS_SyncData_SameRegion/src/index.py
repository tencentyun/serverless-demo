import json
import uuid
import os
import string
import sys
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError


region = os.environ.get('region')
target_bucket = os.environ.get('target_bucket')
source_bucket = os.environ.get('source_bucket')

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

def main_handler(event, context):
    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"errorMsg": "event is not come from cos"}
    
    logger.info("source_bucket is " + source_bucket)
    logger.info("target_bucket is " + target_bucket)
    #使用临时秘钥
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')   

    cosClient = CosS3Client(CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key,Token=token))  

    appid = event['Records'][0]['cos']['cosBucket']['appid']
    key = event['Records'][0]['cos']['cosObject']['key']
    key = key.replace('/' + str(appid) + '/' + event['Records'][0]['cos']['cosBucket']['name'] + '/', '', 1)
    if key[-1] == '/':
        return {"errorMsg": "this is floder,do not need to sync"}

    logger.info("key:"+ key)
    response = cosClient.copy_object(Bucket=target_bucket, Key=key,
    CopySource={
        'Bucket': source_bucket, 
        'Key': key,
        'Region': region
    })
    print("response is ",response)

    return 'copy success'