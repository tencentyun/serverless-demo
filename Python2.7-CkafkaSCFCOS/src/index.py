# -*- coding=utf-8

#####----------------------------------------------------------------#####
#####                                                                #####
#####   使用教程/readme:                                              #####
#####   https://cloud.tencent.com/document/product/583/30722         #####
#####                                                                #####
#####----------------------------------------------------------------#####

import os
import logging
import datetime
import random
import pytz
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from qcloud_cos_v5 import CosClientError

# Setting user properties, including secret_id, secret_key, region, bucket
# 设置用户属性, 包括secret_id, secret_key, region，bucket
appid = '1251762227'  # Please replace with your APPID. 请替换为您的 APPID
secret_id = u'*********'  # Please replace with your SecretId. 请替换为您的 SecretId
secret_key = u'********'  # Please replace with your SecretKey. 请替换为您的 SecretKey
region = 'ap-guangzhou'  # Please replace with your region. 替换为用户的region
token = ''  # To use the temporary key, you need to pass in the Token. The default is empty. 使用临时秘钥需要传入Token，默认为空,可不填
bucket_upload = "mason-ckafka-scf-cos-1251762227"  # Please replace with your COS bucket. 替换为需要写入的COS Bucket

# Getting configuration object. 获取配置对象
config = CosConfig(Region=region, Secret_id=secret_id, Secret_key=secret_key, Token=token)
client = CosS3Client(config)
logger = logging.getLogger()

# Generating file name. 生成写入文件名
def object_key_generater():
    logger.info("start to generate key name")
    tz = pytz.timezone('Asia/Shanghai')
    time = datetime.datetime.now(tz).strftime("%Y-%m-%d-%H:%M:%S")
    random_name = random.randint(1, 200)
    dir_name = datetime.datetime.now(tz).strftime("%Y-%m-%d-%H")
    file_name = format(time) + '-' + str(random_name) +'.txt'
    object_key = '{}/{}'.format( dir_name,file_name)
    return object_key

# Check if the file already exists. 检查文件是否已存在
def check_cos_file(key):
    try:
        resp = client.head_object(
            Bucket=bucket_upload,
            Key=key
        )
        logger.info("check_cos_file of resp is [%s]"% resp)
        return True
    except CosServiceError, e:
        # print("head error")
        # if e['code'] == "NoSuchResource":
        logger.info("e is [%s]"% e)
        if e.get_error_code()== "NoSuchResource":
            logger.info("check_cos_file is [%s]"% e.get_error_code())
            return False

# Deleting local file. 删除本地文件
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

# Uploading file to COS. 上传文件到COS
def upload_loacal_file(loacalpath):
    logger.info("Start to upload")
    if os.path.isfile(loacalpath):
        logger.info("local_filename is [%s]" % loacalpath)
        key = object_key_generater()
        while check_cos_file(key) == True:
            key = object_key_generater()
        logger.info("cos_object_name is [%s]" % key)
        response = client.put_object_from_local_file(
            Bucket=bucket_upload,
            LocalFilePath=loacalpath,
            Key=key)
        logger.info("upload result is [%s]" % response)
        delete_local_file(str(loacalpath))
        return True
    else:
        logger.info("Upload fail")
        return False

def main_handler(event, context):
    logger.info("start main handler")
    local_path = '/tmp/local_file.txt'
    data = ""
    with open(local_path, "a") as f:
        for record in event['Records']:
            if 'Ckafka' not in record.keys():
                continue
            data = record['Ckafka']['msgBody'].decode("unicode-escape")
            # logger.info("data is [%s]" % data)
            f.write(data)
            f.write('\r\n')
    if upload_loacal_file(local_path) == True:
        return "write success"
    else:
        return "write fail"
