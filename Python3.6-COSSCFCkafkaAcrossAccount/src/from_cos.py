#!/usr/bin/env python
# -*- coding=utf-

import os
import logging
import time
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from qcloud_cos_v5 import CosClientError

logger = logging.getLogger('FromCos')
logger.setLevel(logging.INFO)

class FromCos(object):
    def __init__(self, appid , secret_id, secret_key,region,token):
        self.appid = appid
        config = CosConfig(Secret_id=secret_id, Secret_key=secret_key, Region=region, Token=token)

        self.client = CosS3Client(config)

    def getMessage(self , event):
        messages = []        
        eventList = []
        try:
            if "Records" in event:
                eventList = event["Records"]
                for record in eventList:
                    bucket = record['cos']['cosBucket']['name'] + '-' + str(self.appid)
                    key = record['cos']['cosObject']['key']
                    key = key.replace('/' + str(self.appid) + '/' + record['cos']['cosBucket']['name'] + '/', '', 1)
                    # download object from cos
                    logger.info("Get from [%s] to download file [%s]" % (bucket, key))
                    download_path = '/tmp/{}'.format(key.replace('/','-'))
                    try:
                        response = self.client.get_object(Bucket=bucket, Key=key, )
                        response['Body'].get_stream_to_file(download_path)
                    except CosServiceError as e:
                        print(e.get_error_code())
                        print(e.get_error_msg())
                        print(e.get_resource_location())
                        return "Fail"
                    logger.info("Download file [%s] Success" % key)
                    with open(download_path,'r',encoding='utf-8') as f:
                        read_data=f.read()
                        if len(read_data)>0:
                            messages.append(read_data)
                        f.closed
                    os.remove(download_path)
        except Exception as e:
            print(e)
            print('Error getting object {} from bucket {}. '.format(key, bucket))
            raise e
        return messages