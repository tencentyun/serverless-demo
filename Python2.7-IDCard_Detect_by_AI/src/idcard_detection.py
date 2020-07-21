# -*- coding: utf-8 -*-
import json
import os
import logging
import datetime
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException 
from tencentcloud.ocr.v20181119 import ocr_client, models
from PIL import Image
import PIL.Image
import sys
import base64

print('Loading function')
region = u'ap-beijing'         # Modify the area according to the actual situation. 根据实际情况，修改地域

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


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

def idcard_detection(secret_id,secret_key,token,download_path,CardSide):
    try: 
        cred = credential.Credential(secret_id,secret_key,token) 
        httpProfile = HttpProfile()
        httpProfile.endpoint = "ocr.tencentcloudapi.com"
        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        client = ocr_client.OcrClient(cred, "ap-beijing", clientProfile) 
        req = models.IDCardOCRRequest()
        with open(download_path, "rb") as f:
            base64_data = base64.b64encode(f.read())      
        params = '{"ImageBase64":"%s","CardSide":"%s"}'%(base64_data,CardSide)
        req.from_json_string(params)
        resp = client.IDCardOCR(req) 
        res_ai = json.loads(resp.to_json_string())
        return res_ai
    except TencentCloudSDKException as err:    
        # print(err)
        return -1

def main_handler(event, context):
    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"errorMsg": "event is not come from cos"}
    
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')     
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')  
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
    appid = event['Records'][0]['cos']['cosBucket']['appid']
    config = CosConfig(Secret_id=secret_id, Secret_key=secret_key, Region=region, Token=token)
    cos_client = CosS3Client(config)
    bucket = event['Records'][0]['cos']['cosBucket']['name'] + '-' + str(appid)
    key = event['Records'][0]['cos']['cosObject']['key']
    key = key.replace('/' + str(appid) + '/' + event['Records'][0]['cos']['cosBucket']['name'] + '/', '', 1)
    download_path = '/tmp/{}'.format(key)
    tmpload_path = '/tmp/resized-{}'.format(key)
    logger.info("Key is " + key)
    logger.info("Get from [%s] to download file [%s]" % (bucket, key))

    # download image from cos
    try:
        response = cos_client.get_object(Bucket=bucket, Key=key, )
        response['Body'].get_stream_to_file(download_path)
        logger.info("Download file [%s] Success" % key)
    except CosServiceError as e:
        print(e.get_error_code())
        print(e.get_error_msg())
        print(e.get_resource_location())
        return "Download File Fail"

    # detect idcard
    logger.info("Start Detection")
    CardSide = "FRONT"
    res_ai = idcard_detection(secret_id,secret_key,token,download_path,CardSide)
    if res_ai != -1 :
        res_print = {
            "姓名：": res_ai["Name"],
            "性别：": res_ai["Sex"],
            "出生：": res_ai["Birth"],
            "住址：": res_ai["Address"],
            "民族：": res_ai["Nation"],
            "公民身份证号：": res_ai['IdNum']
        }
        print (json.dumps(res_print).decode('unicode-escape'))
    else:
        CardSide = "BACK"
        res_ai = idcard_detection(secret_id,secret_key,token,download_path,CardSide)
        if res_ai != -1 :
            res_print = {
                "有效期限：": res_ai["ValidDate"],
                "签发机关：": res_ai["Authority"]
            }
            print (json.dumps(res_print).decode('unicode-escape'))
        else:
            return "Detect Fail"

    # delete local file
    delete_local_file(str(download_path))
    return res_print