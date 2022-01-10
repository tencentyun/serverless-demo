#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import json
import time
import pytz
import datetime
import logging
from multiprocessing import Process
from tencentserverless.scf import Client
from tencentserverless.exception import TencentServerlessSDKException
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from pykafka.client import KafkaClient as PyKafkaClient

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


def timer_handler(context):
    logger.info("Timer Invoke begin time: %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                                                                                   pytz.timezone(
                                                                                       'Asia/Shanghai')).strftime(
        '%Y-%m-%d %H:%M:%S')))
    topic_name = os.getenv("topic_name")
    try:
        function_name = context["function_name"]
        namespace = context["namespace"]
        region = os.getenv("region")
        kafka_address = os.getenv("kafka_address")
        client = PyKafkaClient(kafka_address)
        topic = client.topics[topic_name]
        partition_num = len(topic.partitions)
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
                                                                                              pytz.timezone(
                                                                                                  'Asia/Shanghai')).strftime(
            '%Y-%m-%d %H:%M:%S')))
        return "success"

    except Exception as err:
        logger.error(err)
        logger.info("Timer Invoke failed, end time: %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                                                                                             pytz.timezone(
                                                                                                 'Asia/Shanghai')).strftime(
            '%Y-%m-%d %H:%M:%S')))
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
