# readme :  https://cloud.tencent.com/document/product/583/30589
# -*- coding: utf-8 -*-
import os
import logging
import datetime
import base64
import json
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException 
from tencentcloud.ocr.v20181119 import ocr_client, models 
import sys

print('Loading function')

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

def main_handler(event, context):
    logger.info("start main handler")
    if "requestContext" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from api gateway"}
    if "body" not in event.keys():
        return {
            "isBase64Encoded": False,
            "statusCode": 200,
            "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
            "body": "there is no file from api gateway"
        }

    # The image format uploaded from the gateway has been encoded with Base64, which can be directly obtained from event['body'].从网关上传的图片格式已经做过Base64，在event['body']里可以直接获取
    logger.info("Start to detection")
    try: 
        secret_id = os.environ.get('TENCENTCLOUD_SECRETID')     
        secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')  
        token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
        cred = credential.Credential(secret_id,secret_key,token) 
        httpProfile = HttpProfile()
        httpProfile.endpoint = "ocr.tencentcloudapi.com"

        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        client = ocr_client.OcrClient(cred, "ap-beijing", clientProfile)
        req = models.GeneralBasicOCRRequest()
        params = '{"ImageBase64":"%s"}'%event['body']
        req.from_json_string(params)
        resp = client.GeneralBasicOCR(req) 
        res_ai = json.loads(resp.to_json_string())
        res_text = " "
        print (len(res_ai["TextDetections"]))
        for i in range(len(res_ai["TextDetections"])):
            res_text = res_text + str(res_ai["TextDetections"][i]["DetectedText"])

    except TencentCloudSDKException as err: 
        print(err) 
    
    print(res_text)
    response = {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
        "body": res_text
    }

    return response
