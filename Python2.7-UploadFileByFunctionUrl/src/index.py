# -*- coding: utf-8 -*-
import os
import logging
import datetime
import base64
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from qcloud_cos_v5 import CosClientError
import sys

print('Loading function')

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

appid = '1256608914'  # Please replace with your APPID. 请替换为您的 APPID
secret_id = u'**************'  # Please replace with your SecretId. 请替换为您的 SecretId
secret_key = u'*************'  # Please replace with your SecretKey. 请替换为您的 SecretKey
region = u'ap-shanghai'        # Please replace with the region where your function located. 请替换为您函数所在的地域
token = ''
bucket_upload = 'test-ai-mason-1256608914' # Please replace with the bucket name which is used for storaging file. 请替换为您要用来存放文件的bucket名

config = CosConfig(Secret_id=secret_id, Secret_key=secret_key, Region=region, Token=token)
client_cos = CosS3Client(config)
logger = logging.getLogger()


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
            delete_file_folder(itemsrc)
        try:
            os.rmdir(src)
        except:
            pass


def main_handler(event, context):
    logger.info("start main handler")

    # save api gateway file to local temp file
    logger.info("Start to download images from function url")
    time = datetime.datetime.now()
    file_name = '{}'.format(time) + "-test.jpg"
    logger.info("file_name is : %s" % file_name)
    local_path = u'/tmp/{}'.format(file_name)
    logger.info("local_path is : %s" % local_path)
    with open(local_path, 'w') as wfile:
        wfile.write(base64.b64decode(event['body']))

    # start to upload to cos
    logger.info("Start to upload images to cos")
    res_cos = client_cos.put_object_from_local_file(
        Bucket=bucket_upload,
        LocalFilePath=local_path,
        Key='{}'.format(file_name))
    logger.info("upload to cos result is : %s" % res_cos)

    delete_local_file(local_path)
    response = {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
        "body": "Upload to COS success"
    }

    return response