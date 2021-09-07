#!/usr/bin/python
# -*- coding: UTF-8 -*-
############################################################################################################################
# 1. 必填环境 TARGET_COS_REGION，填写 cos bucket 所在地区。
# 2. 必填环境 TARGET_COS_BUCKET，填写 cos bucket 名称。
# 3. 必填环境 TARGET_SCF_REGION，填写 scf 所在地区。
# 4. 选填环境 TARGET_COS_PATH，填写 cos 路径，默认为 /cdnlog/。
# 4. 选填环境 TARGET_CDN_HOSTS，填写需要存储的域名，用英文逗号','分割；默认值为空（即保存账号下所有域名的日志）。
#
# 注意：
# 1. 改函数由 CDN 离线日志转存生成，请不要在 SCF 侧手动修改函数的配置, 包括触发器，否则会导致 CDN离线日志转存失败; 如需修改请移步 CDN 控制台 ！！！
# 2. 函数所在地域和 cos bucket 所在地域需要一致。
#
#############################################################################################################################

import re
import os
import sys
import json
import requests
import logging
import datetime
from urllib.parse import urlparse

from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.cdn.v20180606 import cdn_client, models
from datetime import timedelta

try:
    from qcloud_cos_v5 import CosConfig, CosS3Client, CosServiceError
except:
    from qcloud_cos import CosConfig, CosS3Client, CosServiceError


class Job:
    def __init__(self, config):
        self.config = config

        cred = credential.Credential(config['secret_id'], config['secret_key'], config['token'])
        httpProfile = HttpProfile()
        httpProfile.endpoint = "cdn.tencentcloudapi.com"

        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        cdnClient = cdn_client.CdnClient(cred, config['scf_region'], clientProfile)

        self.cdn_client = cdnClient
        self.cos_path = config['cos_path']

        cos_config = CosConfig(
            Region=config['cos_region'],
            Secret_id=config['secret_id'],
            Secret_key=config['secret_key'],
            Token=config.get('token', None),
        )
        self.cos_client = CosS3Client(cos_config)
        self.cos_bucket = config['cos_bucket']

    def get_cdn_log_urls(self, host):
        '''Getting the log download link for CDN （获取CDN的日志下载链接）'''
        CDN_LOG_STABLE_HOURS = 12 + 1
        CDN_LOG_SAVE_HOURS = 1
        # now = datetime.datetime.now() + timedelta(hours=8)
        now = datetime.datetime.utcnow() + timedelta(hours=8)
        end = now - datetime.timedelta(hours=CDN_LOG_STABLE_HOURS)
        start = end - datetime.timedelta(hours=CDN_LOG_SAVE_HOURS)

        # action = "DescribeCdnDomainLogs"
        action_params = {
            'Domain': host,
            'StartTime': start.strftime("%Y-%m-%d %H:%M:%S"),
            'EndTime': end.strftime("%Y-%m-%d %H:%M:%S"),
        }

        req = models.DescribeCdnDomainLogsRequest()
        req.from_json_string(json.dumps(action_params))
        try:
            resp = self.cdn_client.DescribeCdnDomainLogs(req)
        except:
            return []

        print("resp:%s" % resp.to_json_string())
        data = json.loads(resp.to_json_string())

        urls = [v['LogPath'] for v in data['DomainLogs']]
        if urls:
            logging.info("time(%s~%s) host[%s] log urls are:\n%s\n." % (start, end, host, "\n".join(urls)))
        else:
            logging.info("time(%s~%s) host[%s] log urls are empty" % (start, end, host))
        return urls

    def get_cdn_hosts(self):
        '''Getting a list of all domain names under the account （获取账号下全部域名列表）'''
        offset = 0
        total = 1
        hosts = []
        while offset < total:
            req = models.DescribeDomainsRequest()
            params = {
                "Offset": offset,
                "Limit": 100,
            }
            req.from_json_string(json.dumps(params))
            resp = self.cdn_client.DescribeDomains(req)
            data = json.loads(resp.to_json_string())
            hosts.extend([v['Domain'] for v in data['Domains']])
            total = data['TotalNumber']
            offset = len(hosts)
        hosts.sort()
        logging.info("cdn hosts = %s" % hosts)
        return hosts

    def get_cos_key(self, url):
        '''
        Parsing the URL to generate the storage path of COS format. The URL format is: /day/hour/dayhour-host.gz
        解析URL，生成COS上的存储路径格式
        URL格式为： /day/hour/dayhour-host.gz
        '''
        parts = urlparse(url)
        r = r'/(?P<day>[^/]*)/(?P<hour>[^/]*)/(?P<filename>[^-]*-(?P<host>[^/]*).gz)'
        m = re.match(r, parts.path)
        if not m:
            raise RuntimeError("cdn log url format is not support: %s" % url)
        v = m.groupdict()
        key = self.cos_path % v
        return key

    def invoke_cos_upload(self, url):
        '''
        Role: Storing the CDN log to COS.
        Obtaining the download link of the log on the CDN to check whether the log exists in the COS; if not, upload it to COS.
        作用：将CDN的日志存储到COS上
        获取CDN上日志的下载链接，检测COS是否已存在该日志；若无，则上传到COS
        '''
        logging.info("Process URL: %s" % url)
        status = "skip"
        cos_key = self.get_cos_key(url)
        if not self.cos_exists(cos_key, url):
            status = self.download_url_into_cos(cos_key, url)
        return {"status": status, "url": url, "cos_key": cos_key}

    def cos_exists(self, cos_key, url):
        '''Check if the file already exists 检查文件是否已存在'''
        try:
            rsp = self.cos_client.head_object(
                Bucket=self.cos_bucket,
                Key=cos_key
            )
            logging.debug("cos_client.head_object.rsp = %s" % rsp)
            return True
        except CosServiceError as e:
            if e.get_error_code() == "NoSuchResource":
                return False
            else:
                logging.info("Check COS error: %s" % e)
                raise e

    def download_url_into_cos(self, cos_key, url):
        '''Uploading files and downloading them to COS by streaming fragment upload 采用流式分片上传的方式，下载文件并存入COS'''
        response = requests.get(url, stream=True)

        # start
        rsp = self.cos_client.create_multipart_upload(
            Bucket=self.cos_bucket,
            Key=cos_key)
        cos_id = rsp['UploadId']

        # upload by chunk
        idx = 0
        parts = []
        for chunk in response.iter_content(chunk_size=10 * 1024 * 1024):
            if chunk:  # filter out keep-alive new chunks
                idx += 1
                rsp = self.cos_client.upload_part(
                    Bucket=self.cos_bucket,
                    Key=cos_key,
                    PartNumber=idx,
                    Body=chunk,
                    UploadId=cos_id
                )
                parts.append({'ETag': rsp['ETag'], 'PartNumber': idx})

        # finish
        self.cos_client.complete_multipart_upload(
            Bucket=self.cos_bucket,
            Key=cos_key,
            UploadId=cos_id,
            MultipartUpload={'Part': parts}
        )
        return "success"

    def run(self):
        hosts = self.config['cdn_host']
        if not hosts:
            hosts = self.get_cdn_hosts()

        cnt = 0
        for host in hosts:
            urls = self.get_cdn_log_urls(host)
            for url in urls:
                self.invoke_cos_upload(url)
            cnt += len(urls)
        return {"status": "jobs dispatched", "count_url": cnt, "count_host": len(hosts)}


def run_app():
    # 使用临时秘钥操作CDN接口
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN')
    cos_region = os.environ.get('TARGET_COS_REGION')
    cos_bucket = os.environ.get('TARGET_COS_BUCKET')
    cos_path = os.environ.get('TARGET_COS_PATH')
    scf_region = os.environ.get('TARGET_SCF_REGION')
    origin_cdn_hosts = os.environ.get('TARGET_CDN_HOSTS')
    cdn_hosts = []
    if origin_cdn_hosts:
        cdn_hosts = origin_cdn_hosts.split(',')

    if not cos_region:
        return "must assign environment TARGET_COS_REGION"
    if not cos_bucket:
        return "must assign environment TARGET_COS_BUCKET"
    if not scf_region:
        return "must assign environment TARGET_SCF_REGION"
    if cos_region != scf_region:
        return "environment TARGET_SCF_REGION must equal TARGET_COS_REGION"
    if len(cdn_hosts) > 50:
        return "length of TARGET_CDN_HOSTS must less than 50"
    if not cos_path:
        cos_path = "/cdnlog/"
    if cos_path[-1] != '/':
        cos_path = cos_path + '/'

    config = {
        "secret_id": secret_id,
        "secret_key": secret_key,
        "token": token,
        'cos_region': cos_region,
        'cos_bucket': cos_bucket,
        'cos_path': cos_path + '%(host)s/%(day)s/%(filename)s',
        'scf_region': scf_region,
        'cdn_host': cdn_hosts,
    }

    job = Job(config)
    return job.run()


def main_handler(event, context):
    rsp = run_app()
    return {"statusCode": 200, "body": rsp}
