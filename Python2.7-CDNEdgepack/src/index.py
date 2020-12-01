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
INVALID_OFFSET = '-9999'

# =======================================================
# 必填参数区域
#
# 扩展后的APK需要存放的路径，放空表示扩展后的APK会覆盖原始文件
# e.g. APK_TO_DIR = "/ext"
APK_TO_DIR = "/ext"
#
# BLOCK_ID 是渠道信息的key
BLOCK_ID = 0x71777777
# =======================================================

# =======================================================
# 选填参数区域
#
# 选填以下字段, 使用永久秘钥操作CDN接口
SECRET_ID = ""
SECRET_KEY = ""
# =======================================================

def main_handler(event, context):

    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from cos"}

    try:
        logger.info(event['Records'])
        appid = event['Records'][0]['cos']['cosBucket']['appid']
        bucket = event['Records'][0]['cos']['cosBucket']['name']
        key = event['Records'][0]['cos']['cosObject']['key'].decode("utf-8")
        meta = event['Records'][0]['cos']['cosObject']['meta']
        offset = meta.get("x-cos-meta-offset", INVALID_OFFSET)
        if offset != INVALID_OFFSET:
            logger.info("edgepack completed event, pass it")
            return "edgepack completed event, pass it"
        key = key.replace("/%s/%s/" % (str(appid), bucket), '', 1)
        logger.info("Key is " + key)
        if key[-1] == '/':
            logger.info ("No need to edgepack")
            return "No need to edgepack"

        SECRET_ID = SECRET_ID if 'SECRET_ID' in locals().keys() else ""
        secret_id = os.environ.get('TENCENTCLOUD_SECRETID') if SECRET_ID == "" else SECRET_ID
        SECRET_KEY = SECRET_KEY if 'SECRET_KEY' in locals().keys() else ""
        secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY') if SECRET_KEY == "" else SECRET_KEY
        token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') if (SECRET_ID == "" or SECRET_KEY == "") else None
        cred = credential.Credential(secret_id, secret_key, token) 
        httpProfile = HttpProfile()
        httpProfile.endpoint = "cdn.tencentcloudapi.com"

        region = event['Records'][0]['cos']['cosBucket'].get('s3Region', 'ap-shanghai')
        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        client = cdn_client.CdnClient(cred, region, clientProfile)

        cosUriFrom = key
        # 默认扩展后的apk是覆盖原始apk的
        cosUriTo = key
        # 如果有指定扩展目录，先确定目标文件夹必须是合法的
        if APK_TO_DIR != "" and APK_TO_DIR[0] == "/":
            cosUriTo = os.path.join(APK_TO_DIR, os.path.basename(key))
        req = models.CreateEdgePackTaskRequest()
        params = {
            "CosBucket": "%s-%s" % (bucket, str(appid)), 
            "CosUriFrom": cosUriFrom,
            "CosUriTo":cosUriTo,
            "BlockID": BLOCK_ID,
        }
        req.from_json_string(json.dumps(params))
        logger.info(params)

        resp = client.CreateEdgePackTask(req)
        #logger.info(resp.to_json_string())
        #logger.info(resp)
        return "CreateEdgePackTask success"

    except TencentCloudSDKException as err: 
        logger.error(err)
        return "refresh fail"

