#!/usr/bin/python
#-*- coding: UTF-8 -*-
#################################################################################################################################
# 1. In the config variable on line 143, fill in the corresponding configuration information.                                   #
#     Fields such as 'secret_id'、'secret_key'、'cos_region'、'cos_bucket'、'scf_region' need to be filled in.                    #
#     'scf_function' is the storage function name.                                                                              #
#     'cdn-save-log-into-cos' is the region where the function located.                                                         #
#     The default value of 'cdn_host' is an empty array (that is, the log of all domain names under the account is saved),      #
#     and can be modified to fill in the specified domain name list if necessary.                                               #
# 2. This function needs to configure a timing trigger with a trigger period of 1 hour.                                         #
# -------------------------------------------------------------------------------------                                         #
# 1.    在第143行的config变量中，填写对应的配置信息。                                                                                 #
#     secret_id、secret_key、cos_region、cos_bucket、scf_region等字段需填写；                                                       #
#     scf_function 即存储函数名：cdn-save-log-into-cos，函数地域即函数所在地域；                                                       #
#     cdn_host 的默认值为空数组（即保存账号下所有域名的日志），如有需要可以修改填入指定域名列表。                                             #
# 2. 该函数需要配置定时触发器，触发周期为1小时。                                                                                       #
#################################################################################################################################

import re
import os
import sys
import json
import requests
import urlparse
import logging
import datetime

from tencentcloud.common import credential
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.scf.v20180416 import scf_client,models
from QcloudApi.qcloudapi import QcloudApi

class Job:
    def __init__(self, config):
        self.config = config

        # scf api client
        cred = credential.Credential(config['secret_id'], config['secret_key'])
        self.scf_client = scf_client.ScfClient(cred, config['scf_region'])

        # cdn api client
        cdn_config = {
            'Region':          'ap-guangzhou',
            'method':          'GET',
            'secretId':        config['secret_id'],
            'secretKey':       config['secret_key'],
            'SignatureMethod': 'HmacSHA1',
            }
        self.cdn_client = QcloudApi("cdn", cdn_config)
        self.cos_path = config['cos_path']

    def get_cdn_log_urls(self, host):
        '''Getting the log download link for CDN （获取CDN的日志下载链接）'''
        CDN_LOG_STABLE_HOURS = 12+1
        CDN_LOG_SAVE_HOURS   = 1
        now = datetime.datetime.now()
        end = now - datetime.timedelta(hours=CDN_LOG_STABLE_HOURS)
        start = end - datetime.timedelta(hours=CDN_LOG_SAVE_HOURS)

        action = "GetCdnLogList"
        action_params = {
                'host': host,
                'startDate': start.strftime("%Y-%m-%d %H:%M:%S"),
                'endDate': end.strftime("%Y-%m-%d %H:%M:%S"),
                }
        rsp = self.cdn_client.call(action, action_params)
        data = json.loads(rsp)
        if data['code'] != 0:
            logging.error("API %s error: %s" % (action, data))
            return []
        urls = [ v['link'] for v in data['data']['list'] if v['type'] ]
        if urls:
            logging.info("time(%s~%s) host[%s] log urls are:\n%s\n." % (start, end, host, "\n".join(urls))  )
        else:
            logging.info("time(%s~%s) host[%s] log urls are empty" % (start, end, host) )
        return urls

    def get_cdn_hosts(self):
        '''Getting a list of all domain names under the account （获取账号下全部域名列表）'''
        action = "DescribeCdnHosts"
        end = datetime.datetime.now()
        start = end - datetime.timedelta(days=1)
        action_params = {
                'detail': 0,
                }
        rsp = self.cdn_client.call(action, action_params)
        data = json.loads(rsp)
        if data['code'] != 0:
            logging.error("API %s error: %s" % (action, data))
            return []
        hosts = [ v['host'] for v in data['data']['hosts'] ]
        logging.info("cdn hosts = %s" % hosts)
        return hosts

    def get_cos_key(self, url):
        '''
        Parsing the URL to generate the storage path of COS format. The URL format is: /day/hour/dayhour-host.gz
        解析URL，生成COS上的存储路径格式
        URL格式为： /day/hour/dayhour-host.gz
        '''
        parts = urlparse.urlparse(url)
        r = r'/(?P<day>[^/]*)/(?P<hour>[^/]*)/(?P<filename>[^-]*-(?P<host>[^/]*).gz)'
        m = re.match(r, parts.path)
        if not m:
            raise RuntimeError("cdn log url format is not support: %s" % url)
        v = m.groupdict()
        key = self.cos_path % v
        return key

    def invoke_cos_upload(self, url):
        event = dict(self.config)
        event.update({"url": url, "cos_key": self.get_cos_key(url) })
        action = "Invoke"
        action_params = {
            'InvocationType': "Event", # asynchronous 异步
            'FunctionName': self.config['scf_function'],
            'ClientContext': json.dumps(event),
        }

        # Calling the interface, initiating the request, and printing the returned result. 调用接口，发起请求，并打印返回结果
        try:
            ret = self.scf_client.call(action, action_params)
            print(json.loads(ret)["Response"]["Result"]["RetMsg"])
        except TencentCloudSDKException as err:
            print(err)


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
    config = {
        'secret_id':    'xxxxx',
        'secret_key':   'xxxxx',

        # The region of COS bucket. COS存储桶的区域
        'cos_region':   'ap-xxxx',
        'cos_bucket':   'xxxxxxx-1251002854',
        'cos_path':     '/cdnlog/%(host)s/%(day)s/%(filename)s',

        # SCF configuration, region and function names need to be consistent with the storage function. SCF配置，地域和函数名字需要和存储函数保持一致
        'scf_region':   'ap-xxxx', 
        'scf_function': 'cdn-save-log-into-cos',

        # CDN configuration. CDN配置
        # If the domain name list is empty, it means to synchronize the logs of all domain names under the entire account. 如果域名列表为空，则表示同步整个账号下全部域名的日志
        'cdn_host':     [],
        #'cdn_host':     ['tx-cdn.talebook.org','js.talebook.org'],
    }

    job = Job(config)
    return job.run()

def main_handler(event, context):
    rsp = run_app()
    return { "statusCode": 200, "body": rsp }
