# -*- coding: utf-8 -*-
import os
import logging
import datetime
import base64
import json
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from qcloud_cos_v5 import CosClientError
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

bucket_region = os.environ.get('bucket_region') # Adding the environment variable 'bucket_region' to the function configuration and fill in the area where your COS Bucket is located.请在函数配置中添加环境变量bucket_region，并填入您COS Bucket所在的地域
bucket_upload = os.environ.get('bucket_upload')  # Adding the environment variable 'bucket_upload' to the function configuration and fill in the bucket name which is used to storage pictures. 请在函数配置中添加环境变量bucket_upload，并填入您要用来存放图片的Bucket名

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
    if "requestContext" not in event.keys():
        return {"code": 410, "errorMsg": "event is not come from api gateway"}
    if "body" not in event.keys():
        return {
            "isBase64Encoded": False,
            "statusCode": 200,
            "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
            "body": "there is no file from api gateway"
        }

    # save api gateway file to local temp file
    logger.info("Start to download images from APIGW")
    time = datetime.datetime.now()
    file_name = '{}'.format(time) + "-test.jpg"
    logger.info("file_name is : %s" % file_name)
    local_path = u'/tmp/{}'.format(file_name)
    logger.info("local_path is : %s" % local_path)
    with open(local_path, 'w') as wfile:
        wfile.write(base64.b64decode(event['body']))

    # start to upload to cos
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      # Using the secterId in environment variables. 使用环境变量中的 secretId
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    # Using the secretKey in environment variables. 使用环境变量中的 secretKey
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
    config = CosConfig(Region=bucket_region, SecretId=secret_id, SecretKey=secret_key, Token=token,)
    cos_client = CosS3Client(config)
    logger.info("Start to upload images to cos")
    res_cos = cos_client.put_object_from_local_file(
        Bucket=bucket_upload,
        LocalFilePath=local_path,
        Key='{}'.format(file_name))
    logger.info("upload to cos result is : %s" % res_cos)

    # start to detection
    logger.info("Start to detection")
    try: 
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
        print len(res_ai["TextDetections"])
        for i in range(len(res_ai["TextDetections"])):
            res_text = res_text + str(res_ai["TextDetections"][i]["DetectedText"].encode('utf-8'))

    except TencentCloudSDKException as err: 
        print(err) 
    

    delete_local_file(local_path)
    response = {
        "isBase64Encoded": False,
        "statusCode": 200,
        "headers": {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
        "body": res_text
    }

    return response
