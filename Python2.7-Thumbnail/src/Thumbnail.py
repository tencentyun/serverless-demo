# -*- coding: utf-8 -*-
# The user needs to create two COS Buckets, one for uploading the original pictures, and configurated as a trigger of SCF and the other for receiving the compressed pictures.
# 用户需要创建2个COS Bucket，一个用于上传原始图片，并配置SCF为该COS Bucket触发，另一个用于接收压缩后的图片

import os
from PIL import Image
import datetime
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from qcloud_cos_v5 import CosClientError
import sys
import logging

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

appid = XXXXXX  # Please replace with your APPID. 请替换为您的 APPID
secret_id = u'**************'  # Please replace with your SecretId. 请替换为您的 SecretId
secret_key = u'*************'  # Please replace with your SecretKey. 请替换为您的 SecretKey
region = u'ap-shanghai'        # Please replace with the region where your COS bucket located. 请替换为您bucket 所在的地域
token = ''
resized_bucket = 'XXXXXX'         # Please replace with the bucket you use to store the compressed pictures. 请替换为您用于存放压缩后图片的bucket

config = CosConfig(Secret_id=secret_id, Secret_key=secret_key, Region=region, Token=token)
client = CosS3Client(config)
logger = logging.getLogger()

#Compressing the length and width of the image to 1/2 of the original image. 把图片长、宽压缩至原有图片的1/2
def resize_image(image_path, resized_path):
    with Image.open(image_path) as image:
        image.thumbnail(tuple(x / 2 for x in image.size))
        image.save(resized_path)

# Deleting the image downloaded to local. 把下载到本地的图片删除
def delete_local_file(src):
    logger.info("delete files and folders")
    if os.path.isfile(src):
        try:
            os.remove(src)
        except:
            pass
    elif os.path.isdir(src):
        for item in os.listdir(src):
            itemsrc=os.path.join(src,item)
            delete_local_file(itemsrc)
        try:
            os.rmdir(src)
        except:
            pass

def main_handler(event, context):
    logger.info("start main handler")
    for record in event['Records']:
        try:
            bucket = record['cos']['cosBucket']['name'] + '-' + str(appid)
            key = record['cos']['cosObject']['key']
            key = key.replace('/'+str(appid)+'/'+record['cos']['cosBucket']['name']+'/','',1)
            download_path = '/tmp/{}'.format(key)
            upload_path = '/tmp/resized-{}'.format(key)
            logger.info("Key is " + key)
            logger.info("Get from [%s] to download file [%s]" %(bucket, key))

            # download image from cos
            try:
                response = client.get_object(Bucket=bucket,Key=key,)
                response['Body'].get_stream_to_file(download_path)
            except CosServiceError as e:
                print(e.get_error_code())
                print(e.get_error_msg())
                print(e.get_resource_location())

            logger.info("Download file [%s] Success" % key)

            # compress image here
            logger.info("Image compress function start")
            starttime = datetime.datetime.now()
            resize_image(download_path, upload_path)
            endtime = datetime.datetime.now()
            logger.info("compress image take " + str((endtime-starttime).microseconds/1000) + "ms")

            #upload the compressed image to resized bucket
            response = client.put_object_from_local_file(
            Bucket= resized_bucket,
            LocalFilePath= upload_path.decode('utf-8'),
            Key= key.decode('utf-8')
            )

            #delete local file
            delete_local_file(str(download_path))
            delete_local_file(str(upload_path))
            return "Success"

        except Exception as e:
            print(e)
            print('Error getting object {} from bucket {}. Make sure the object exists and your bucket is in the same region as this function.'.format(key, bucket))
            raise e
