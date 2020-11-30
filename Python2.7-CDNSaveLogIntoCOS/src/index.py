#!/usr/bin/python
#-*- coding: UTF-8 -*-

import os
import re
import sys
import json
import requests
import urlparse
import logging
import datetime
try:
    from qcloud_cos_v5 import CosConfig, CosS3Client, CosServiceError
except:
    from qcloud_cos import CosConfig, CosS3Client, CosServiceError


class Job:
    def __init__(self, config):
        cos_config = CosConfig(
                Region     = config['cos_region'],
                Secret_id  = config['secret_id'],
                Secret_key = config['secret_key'],
                Token      = config.get('token', None),
                )
        self.cos_client = CosS3Client(cos_config)
        self.cos_bucket = config['cos_bucket']
        self.cos_key    = config['cos_key']
        self.url        = config['url']


    def cos_exists(self):
        '''Check if the file already exists 检查文件是否已存在'''
        try:
            rsp = self.cos_client.head_object(
                Bucket=self.cos_bucket,
                Key=self.cos_key
            )
            logging.debug("cos_client.head_object.rsp = %s"% rsp)
            return True
        except CosServiceError, e:
            if e.get_error_code() == "NoSuchResource":
                return False
            else:
                logging.info("Check COS error: %s" % e)
                raise e

    def download_url_into_cos(self):
        '''Uploading files and downloading them to COS by streaming fragment upload 采用流式分片上传的方式，下载文件并存入COS'''
        response = requests.get(self.url, stream=True)

        # start
        rsp = self.cos_client.create_multipart_upload(
                Bucket = self.cos_bucket,
                Key = self.cos_key)
        cos_id = rsp['UploadId']

        # upload by chunk
        idx = 0
        parts = []
        for chunk in response.iter_content(chunk_size=10*1024*1024):
            if chunk:  # filter out keep-alive new chunks
                idx += 1
                rsp = self.cos_client.upload_part(
                        Bucket = self.cos_bucket,
                        Key = self.cos_key,
                        PartNumber = idx,
                        Body = chunk,
                        UploadId = cos_id
                        )
                parts.append({'ETag': rsp['ETag'], 'PartNumber': idx})

        # finish
        self.cos_client.complete_multipart_upload(
                            Bucket = self.cos_bucket,
                            Key = self.cos_key,
                            UploadId = cos_id,
                            MultipartUpload = {'Part': parts}
                            )
        return "success"

    def run(self):
        '''
        Role: Storing the CDN log to COS.
        Obtaining the download link of the log on the CDN to check whether the log exists in the COS; if not, upload it to COS.
        作用：将CDN的日志存储到COS上
        获取CDN上日志的下载链接，检测COS是否已存在该日志；若无，则上传到COS
        '''
        logging.info("Process URL: %s" % self.url)
        status = "skip"
        if not self.cos_exists():
            status = self.download_url_into_cos()
        return {"status": status, "url": self.url, "cos_key": self.cos_key}



def run_job(config):
    for k in ['secret_id', 'secret_key', 'url', 'cos_key', 'cos_bucket', 'cos_region']:
        if k not in config:
            raise RuntimeError("Please set '%s' in handler event" % k)

    logging.info("Request config=%s" % config)
    job = Job(config)
    return job.run()


def main_handler(event, context):
    rsp = run_job(event)
    return { "statusCode": 200, "body": rsp }