 #!/usr/bin/python
# -*- coding: utf-8 -*-
import json
import uuid
import os
import string
import sys
import logging
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException 
from tencentcloud.cdn.v20180606 import cdn_client, models 

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

url_cdn = os.getenv('url_cdn') # 请替换为您要加速的bucket域名，具体的文件路径在main函数里拼装
region = os.getenv('region')  # 请替换为您bucket 所在的地域

def main_handler(event, context):
    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from cos"}
    # 使用临时秘钥操作CDN接口
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')

    try:
        appid = event['Records'][0]['cos']['cosBucket']['appid']
        bucket = event['Records'][0]['cos']['cosBucket']['name'] + '-' + str(appid)
        key = event['Records'][0]['cos']['cosObject']['key']
        key = key.replace('/' + str(appid) + '/' + event['Records'][0]['cos']['cosBucket']['name'] + '/', '', 1)
        logger.info("Key is " + key)
        if key[-1] == '/':
            logger.info ("No need to refresh")
            return "No need to refresh"

        #拼装待刷新的url地址
        rel_url = url_cdn + '/' + key
        logger.info("rel_url is " + rel_url)

        cred = credential.Credential(secret_id, secret_key,token) 
        httpProfile = HttpProfile()
        httpProfile.endpoint = "cdn.tencentcloudapi.com"

        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        client = cdn_client.CdnClient(cred, region, clientProfile)

        req = models.PurgeUrlsCacheRequest()
        params = '{"Urls":["%s"]}'%rel_url
        req.from_json_string(params)

        resp = client.PushUrlsCache(req) #预热
        # resp = client.PurgeUrlsCache(req) #刷新
        logger.info(resp.to_json_string()) 
        return "PurgeUrlsCache success"

    except TencentCloudSDKException as err: 
        logger.error(err)
        return "refresh fail"

