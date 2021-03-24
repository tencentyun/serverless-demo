#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import json
import time
import pytz
import datetime
import logging
from multiprocessing import Process
from tencentcloud.ckafka.v20190819 import ckafka_client, models as ckafka_models
from tencentcloud.common import credential
from tencentserverless.scf import Client
from tencentserverless.exception import TencentServerlessSDKException
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


def timer_handler(context):
    logger.info("Timer Invoke begin time: %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                   pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
    instance_id = os.getenv("instance_id")
    topic_name = os.getenv("topic_name")
    try:
        function_name = context["function_name"]
        namespace = context["namespace"]
        # 实例化一个认证对象，入参需要传入腾讯云账户临时secret_id，secret_key, token
        region = os.getenv("region")
        secret_id = os.getenv("TENCENTCLOUD_SECRETID")
        secret_key = os.getenv("TENCENTCLOUD_SECRETKEY")
        token = os.getenv("TENCENTCLOUD_SESSIONTOKEN")
        cred = credential.Credential(secret_id, secret_key, token)

        # 实例化要请求kafka的client对象
        client = ckafka_client.CkafkaClient(cred, region)

        # 实例化一个请求对象
        req = ckafka_models.DescribeTopicAttributesRequest()
        req.InstanceId = instance_id
        req.TopicName = topic_name

        # 通过client对象调用想要访问的接口，需要传入请求对象
        resp = client.DescribeTopicAttributes(req)

        # 输出json格式的字符串回包
        logger.debug("get topic attributes: %s", resp.to_json_string())
        ret_value = json.loads(s=resp.to_json_string())

        logger.info("PartitionNum: %s", str(ret_value["Result"]["PartitionNum"]))
        partition_num = ret_value["Result"]["PartitionNum"]
        process_list = list()
        for partition_id in range(partition_num):
            logger.debug("job-------:" + str(partition_id))
            p = Process(target=kafka_consumer_api_handler, name='kafka_consumer_api_handler(%s)' % "",
                        args=(region, namespace, function_name, partition_id))
            process_list.append(p)

        for p in process_list:
            p.start()

        for p in process_list:
            p.join()
        logger.info("Timer Invoke success, end time: %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        return "success"

    except TencentCloudSDKException as err:
        logger.error(err)
        logger.info("Timer Invoke failed, end time: %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        return "failed"


def kafka_consumer_api_handler(region, namespace, function_name, partition_id):
    try:
        # 实例化要请求产品的client对象，以及函数所在的地域
        logger.info('Start invoke self consumer by event, partition_id:%s', str(partition_id))
        scf = Client(region=region)
        client_param = {"partition_id": partition_id, "Type": "ConsumeKafkaGroupByPartition"}
        ret = scf.invoke(function_name=function_name, namespace=namespace, invocation_type="Event", data=client_param)
        # 调用接口，发起请求，并打印返回结果
        # ret_value = json.loads(s=ret.to_json_string())
        logger.info("ret_value: %s", str(ret))

    except TencentServerlessSDKException as e:
        logger.error(e)

    except TencentCloudSDKException as e:
        logger.error(e)

    except Exception as e:
        logger.error(e)
