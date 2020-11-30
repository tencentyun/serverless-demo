# -*- coding: utf8 -*-
import json
import uuid
import os
import string
import sys
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
import time

source_region = os.getenv('source_region')
target_region = os.getenv('target_region')
target_bucket = os.getenv('target_bucket')
# secret_id = os.getenv('secret_id') 
# secret_key = os.getenv('secret_key')

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

#删除本地文件
def delete_local_file(src):
    logger.info("delete files and folders")
    if os.path.isfile(src):
        try:
            os.remove(src)
        except:
            pass
    elif os.path.isdir(src):
        for item in os.listdir(src):
            itemsrc = os.path.join(src, item)
            delete_local_file(itemsrc)
        try:
            os.rmdir(src)
        except:
            pass

def main_handler(event, context):
    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"errorMsg": "event is not come from cos"}

    #初始化COS及获取COS文件信息
    appid = event['Records'][0]['cos']['cosBucket']['appid']
    bucket = event['Records'][0]['cos']['cosBucket']['name'] + '-' + str(appid)
    key = event['Records'][0]['cos']['cosObject']['key']
    key = key.replace('/' + str(appid) + '/' + event['Records'][0]['cos']['cosBucket']['name'] + '/', '', 1)
    if key[-1] == '/':
        return {"errorMsg": "this is floder"}
    # 提取文件名 shotname
    folder_path,file_name = os.path.split(key)
    download_path = '/tmp/{}'.format(file_name)

    logger.info("File_name is " + key)
    logger.info("download_path is " + download_path)
    logger.info("Get from [%s] to download file [%s]" % (bucket, key))

    #使用临时秘钥
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')   

    # 从COS下载需要同步的文件
    cos_client_source = cosClient = CosS3Client(CosConfig(Region=source_region, SecretId=secret_id, SecretKey=secret_key,Token=token))   
    try:
        response = cos_client_source.get_object(Bucket=bucket, Key=key, )
        response['Body'].get_stream_to_file(download_path)
        logger.info("Download file [%s] Success" % key)
    except CosServiceError as e:
        logger.info("Download file [%s] Fail" % key)
        logger.error(e.get_error_code())
        logger.error(e.get_error_msg())
        logger.error(e.get_resource_location())
        delete_local_file(str(download_path))
        return ("Download file [%s] from [%s] fail" % (key,bucket))


    # 同步文件到异地COS bucket
    logger.info("Start to upload file to target_bucket") 
    cos_client_target = cosClient = CosS3Client(CosConfig(Region=target_region, SecretId=secret_id, SecretKey=secret_key,Token=token))
    try:
        response = cos_client_target.put_object_from_local_file(
            Bucket=target_bucket,
            LocalFilePath=download_path,
            Key=key)
        logger.info("Upload result is [%s]" % response)
    except CosServiceError as e:
        logger.error(e.get_error_code())
        logger.error(e.get_error_msg())
        logger.error(e.get_resource_location())
        delete_local_file(str(download_path))
        return ("Upload file [%s] from [%s] fail" % (key,bucket))

    delete_local_file(str(download_path))
    return "Sync File Success"