# -*- coding: utf8 -*-
import sys
import os
import logging
import json
import requests
import smtplib
import time
import datetime
import math

#import tencentcloud-sdk-python
from qcloud_cos_v5 import CosConfig 
from qcloud_cos_v5 import CosS3Client

from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.monitor.v20180724 import monitor_client, models
from datetime import timedelta

logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

def checkQuota():
    secret_id = '改为所用的secret_id'     # 用户的 SecretId，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
    secret_key = '改为所用的secret_key'   # 用户的 SecretKey，建议使用子账号密钥，授权遵循最小权限指引，降低使用风险。子账号密钥获取可参见 https://cloud.tencent.com/document/product/598/37140
    region = '改为所用的园区信息，格式为ap-beijing'      # 替换为bucket所属的 region，已创建桶归属的 region 可以在控制台查看，https://console.cloud.tencent.com/cos5/bucket
                            # COS 支持的所有 region 列表参见 https://cloud.tencent.com/document/product/436/6224
    token = None               # 如果使用永久密钥不需要填入 token，如果使用临时密钥需要填入，临时密钥生成和使用指引参见 https://cloud.tencent.com/document/product/436/14048
    scheme = 'https'           # 指定使用 http/https 协议来访问 COS，默认为 https，可不填
    bucket = '改为所用的桶名称，格式为bucket-appid'

    localOffset = datetime.timedelta(hours = 8) #本地时差，当前以北京为例，UTC+8
    S_delay = datetime.timedelta(minutes=15) #开始时间差值，因云监控上报有时延，这里时间前置调整，时延单位为分钟
    E_delay = datetime.timedelta(minutes=10) #结束时间差值，因云监控上报有时延，这里时间前置调整，时延单位为分钟

    time_start = datetime.datetime.now() + localOffset - S_delay    #查询云监控的开始时间，为当前时间前置15分钟。
    time_end = datetime.datetime.now() + localOffset - E_delay      #查询云监控的结束时间，为当前时间前置10分钟。
    
    cred = credential.Credential(secret_id, secret_key)
    # 实例化一个http选项，可选的，没有特殊需求可以跳过
    httpProfile = HttpProfile()
    httpProfile.endpoint = "monitor.tencentcloudapi.com"

    # 实例化一个client选项，可选的，没有特殊需求可以跳过
    clientProfile = ClientProfile()
    clientProfile.httpProfile = httpProfile
    # 实例化要请求产品的client对象,clientProfile是可选的
    client = monitor_client.MonitorClient(cred, region, clientProfile)

    # 这里是获取云监控的分钟级数据
    # MetricName 参数 InternetTraffic 指的是外网下行流量，CdnOriginTraffic指的是CDN回源流量，其他相关监控指标详见https://cloud.tencent.com/document/product/248/45140
     
    req = models.GetMonitorDataRequest()
    params = {
        "Namespace": "QCE/COS",
        "MetricName": "InternetTraffic",
        "Period": 60,
        "StartTime": time_start.strftime("%Y-%m-%d %H:%M:%S"),
        "EndTime": time_end.strftime("%Y-%m-%d %H:%M:%S"),
        "Instances": [
            {
                "Dimensions": [
                    {
                        "Name": "bucket",
                        "Value": bucket
                    }
                ]
            }
        ]
    }
    req.from_json_string(json.dumps(params))

    # 返回的resp是一个GetMonitorDataResponse的实例，与请求对象对应
    resp = client.GetMonitorData(req)
    # 输出json格式的字符串回包
    _str = resp.to_json_string()
    print(_str)
    print("------------------------------------------------------")
    jsObj = json.loads(_str)
    
    for k,v in jsObj.items():
        if k == "DataPoints":
            for k,v in v[0].items():
                if k == "Values":
                    _flow = sum(v)                   
                    
    if _flow > 5000*1024*1024:   #超过5GB流量阈值        
        config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=token, Scheme=scheme)
        cosclient = CosS3Client(config)
        cosclient.put_bucket_acl(
        Bucket=bucket,
        ACL='private'
        )
        print("判断阈值",_flow)
        print("达到阈值，已改为私有读写权限")
    else:
        ''' 如果需要在盗刷后自动恢复公共读权限，则去掉这段注释。
        config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=token, Scheme=scheme)
        cosclient = CosS3Client(config)
        cosclient.put_bucket_acl(
        Bucket=bucket,
        ACL='public-read'
        )  
        '''      
        print("判断阈值",_flow)
        print("未达到阈值，不做权限修改操作")


def main_handler(event, context):
    checkQuota()


if __name__ == '__main__':
    main_handler("", "")