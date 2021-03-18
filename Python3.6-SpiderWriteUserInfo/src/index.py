#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import re
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client


def write_to_cos(path,cos_path):
    """输出用户信息"""
    matchObj = re.match( r'https://(.*).cos.(.*).myqcloud.com(.*)', cos_path, re.M|re.I)
    dst_bucket = matchObj.group(1)
    dst_path = matchObj.group(3)
    
    region = matchObj.group(2)
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')
   

    cos_client = CosS3Client(CosConfig(Region=region,
                                        SecretId=secret_id,
                                        SecretKey=secret_key,
                                        Token=token))
                                        

    cos_client.put_object_from_local_file(Bucket=dst_bucket, 
                                        LocalFilePath=path,
                                        Key=dst_path + '/' + path.split('/')[-1])
                                        
    delete_local_file(path) 
    
    return {"file":dst_bucket + dst_path + '/' +  path.split('/')[-1]}

#删除本地文件
def delete_local_file(src):
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

    return write_to_cos(event["path"],event["cos_path"])