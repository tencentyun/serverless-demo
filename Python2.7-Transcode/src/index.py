#!/usr/bin/env python
# coding:utf-8
#####----------------------------------------------------------------#####
#####                                                                #####
#####   使用教程/readme:                                              #####
#####   https://cloud.tencent.com/document/product/583/47071         #####
#####                                                                #####
#####----------------------------------------------------------------#####
import os
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
import logging
import requests
import sys

region = os.environ.get('region')
target_bucket = os.environ.get('target_bucket')
target_path = os.environ.get('target_path')

#指定ffmpeg默认运行的路径
path = os.getenv('PATH')
os.environ['PATH']=path+":/tmp"

#ffmpeg命令
#视频压缩
video_press = 'ffmpeg  -i %s -r 10 -b:a 32k %s'
#视频截取 
video_cut = 'ffmpeg -ss 00:00:00 -t 00:00:10 -i %s -vcodec copy -acodec copy %s'
#获取视频时长
video_length = 'ffmpeg -i %s 2>&1 | grep "Duration"'

#控制log输出级别
logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

# 移动ffmpeg到tmp目录，并且赋予权限,tmp是云函数的本地磁盘空间，可读可写
with open("/var/user/ffmpeg", "rb") as rf:
    with open("/tmp/ffmpeg", "wb") as wf:
        wf.write(rf.read())
os.popen('chmod 755 /tmp/ffmpeg')


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
    #判断请求是否从API网关传递,通过网关传递源文件下载地址，在body中获取
    if "body" in event.keys():
        download_path = event['body']
        key = download_path.split('/')[-1]
        logger.info('api download_path: '+ download_path)

    #判断请求是否从COS传递
    elif "Records" in event.keys():
        #从event里获取COS文件信息，并获取下载地址
        bucket = event['Records'][0]['cos']['cosBucket']['name'] + '-' + event['Records'][0]['cos']['cosBucket']['appid']
        key = "/".join(event['Records'][0]['cos']['cosObject']['key'].split("/")[3:])
        download_path = event['Records'][0]['cos']['cosObject']['url']
        logger.info('cos download_path: '+ download_path)
    else:
        return {"code": 410, "errorMsg": "event does not come from COS or APIGW"}
    #使用临时秘钥初始化COS Client
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
    cosClient = CosS3Client(CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key,Token=token))

    logger.info('key: '+ key)
    upload_path = '/tmp/new-'+ key.split('/')[-1]
    logger.info('upload_path: '+ upload_path)
    # 执行ffmpeg命令，从下载地址读流的方式进行转码
    ret = os.popen( video_press %(download_path, upload_path) ).read()
    print(ret)
    # 上传视频，可自定义上传路径
    cosClient.put_object_from_local_file(
        Bucket=target_bucket,
        LocalFilePath=upload_path,
        Key= target_path+'/'+ upload_path.split('/')[-1]
    )
    delete_local_file(upload_path) 
    
    return 'success'
