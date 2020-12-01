#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import time
import datetime
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosClientError, CosServiceError
from pykafka.exceptions import ConsumerStoppedException
from pykafka.client import KafkaClient
from pykafka.common import OffsetType
from kafka import KafkaConsumer,TopicPartition

to_cos_bytes_up_limit = 1024 * 1024 * 500  # 每次最大投递cos包大小 500M
to_cos_bytes_down_limit = 1  # 每次最小投递cos包大小 1B
partition_max_timeout_ms_up_limit = 15 * 60 * 1000  # 最大timeout时间
partition_max_timeout_ms_down_limit = 5 * 60 * 1000  # 最小timeout时间
max_to_cos_time_s = 5  # 最小timeout时间
consumer_timeout_ms = 3000  # 默认partition多久时间没消息就退出

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)


class KafkaToCos(object):
    '''
    消费kafka 投递cos
    '''

    def __init__(self, kafka_instance_id, topic_name, topic_id, kafka_address, bucket_address,
                 partition_max_to_cos_bytes,
                 partition_max_timeout_ms, partition_id, consumer_timeout_ms, group_id, offset_type, region, secret_id,
                 secret_key,
                 token=None):
        self.topic_name = topic_name
        self.topic_id = topic_id
        self.kafka_address = kafka_address
        self.bucket_address = bucket_address
        self.kafka_instance_id = kafka_instance_id
        self.partition_max_to_cos_bytes = partition_max_to_cos_bytes
        self.partition_max_timeout_ms = partition_max_timeout_ms
        self.partition_id = partition_id
        self.consumer_timeout_ms = consumer_timeout_ms
        self.group_id = group_id
        self.offset_type = offset_type
        config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=token)  # 获取配置对象
        self.client = CosS3Client(config)

    # Generating file name. 生成写入文件名
    def object_key_generate(self):
        logger.info("start to generate key name")
        today = str(datetime.date.today())
        file_name = str(int(round(time.time() * 1000)))
        dir_name = "{}/{}/{}".format(str(self.kafka_instance_id), str(self.topic_id), today)
        object_key = '{}/{}'.format(dir_name, file_name)
        return object_key

    # Check if the file already exists. 检查文件是否已存在
    def check_cos_file(self, key):
        try:
            resp = self.client.head_object(
                Bucket=self.bucket_address,
                Key=key
            )
            logger.info("check_cos_file of resp is [%s]" % resp)
            return True
        except CosServiceError, e:
            logger.info("e is [%s]" % e)
            if e.get_error_code() == "NoSuchResource":
                logger.info("check_cos_file is [%s]" % e.get_error_code())
                return False

    # Deleting local file. 删除本地文件
    def delete_local_file(self, src):
        try:
            logger.info("delete files and folders")
            if os.path.isfile(src):
                os.remove(src)
            elif os.path.isdir(src):
                for item in os.listdir(src):
                    item_src = os.path.join(src, item)
                    self.delete_local_file(item_src)
                os.rmdir(src)
        except Exception as err:
            logger.error("delete files and folders error: %s", err)
            pass

    # Uploading file to COS. 上传文件到COS
    def upload_local_file(self, local_path):
        start_time = int(time.time())
        logger.info("Start to upload time: %s", str(start_time))
        logger.info("local file sizes: %s", str(os.path.getsize(local_path)))

        if os.path.getsize(local_path) <= 0:
            logger.info("local file is empty")
            return True
        # 判断文件名是否存在
        if os.path.isfile(local_path):
            logger.info("local_filename is [%s]" % local_path)
            key = self.object_key_generate()
            while self.check_cos_file(key) is True:
                key = self.object_key_generate()
            logger.debug("cos_object_name is: [%s]", key)
            # 简单上传,STANDARD_IA：低频存储
            response = self.client.put_object_from_local_file(Bucket=self.bucket_address, LocalFilePath=local_path,
                                                              Key=key, StorageClass="STANDARD_IA")
            logger.debug("upload result is [%s]" % response)
            logger.info("upload cost time: %s", str(int(time.time()) - start_time))
            return True
        else:
            logger.error("Upload fail")
            return False

    # check params. 检查参数是否正确
    def param_check(self):
        try:
            if self.kafka_instance_id is None:
                return "kafka_instance_id is empty"
            if self.topic_name is None:
                return "topic_name is empty"
            if self.topic_id is None:
                return "topic_id is empty"
            if self.kafka_address is None:
                return "kafka_address is empty"
            if self.bucket_address is None:
                return "bucket_address is empty"
            if self.partition_max_to_cos_bytes is None:
                return "partition_max_to_cos_bytes is empty"
            if self.partition_max_timeout_ms is None:
                return "partition_max_timeout is empty"
            if self.consumer_timeout_ms is None:
                return "consumer_timeout_ms is empty"
            if self.offset_type is None:
                self.offset_type = "earliest"

            # 验证consumer_timeout_ms 取值
            self.consumer_timeout_ms = int(self.consumer_timeout_ms)
            if self.consumer_timeout_ms <= 0:
                self.consumer_timeout_ms = consumer_timeout_ms

            # 验证partition_max_to_cos_bytes 取值
            self.partition_max_to_cos_bytes = int(self.partition_max_to_cos_bytes)
            if self.partition_max_to_cos_bytes > to_cos_bytes_up_limit:
                self.partition_max_to_cos_bytes = to_cos_bytes_up_limit
            if self.partition_max_to_cos_bytes <= 0:
                self.partition_max_to_cos_bytes = to_cos_bytes_down_limit

            # 验证partition_max_timeout_ms 取值
            self.partition_max_timeout_ms = int(self.partition_max_timeout_ms)
            if self.partition_max_timeout_ms > partition_max_timeout_ms_up_limit:
                self.partition_max_timeout_ms = partition_max_timeout_ms_up_limit
            if self.partition_max_timeout_ms <= 0:
                self.partition_max_timeout_ms = partition_max_timeout_ms_down_limit

            return ""
        except CosClientError as err:
            return str(err)

    def calculation_max_to_cos_time(self):
        # 根据函数每次toCos的包大小（50M, 100M，150M，，500M）以及 toCos的带宽推算出对应toCos的最大预留时间
        if self.partition_max_to_cos_bytes > 50 * 1024 * 1024:
            return max_to_cos_time_s + (self.partition_max_to_cos_bytes / (50 * 1024 * 1024))
        else:
            return max_to_cos_time_s

    def worker(self):
        local_path = '/tmp/local_file.txt'
        # local_path = os.getcwd() + '/local_file.txt'
        if os.path.exists(local_path):
            os.remove(local_path)
        os.mknod(local_path)
        f = open(local_path, 'w')
        max_to_cos_time = self.calculation_max_to_cos_time()
        start_time = int(time.time())
        logger.info("start time:%s", str(start_time))
        client = KafkaClient(hosts=self.kafka_address)
        msg_consumed_count = 0
        reset_offset_on_start_status = False
        topic = client.topics[self.topic_name.encode()]
        partitions = topic.partitions

        if self.offset_type.lower() == 'earliest':
            start_offset = OffsetType.EARLIEST
        elif self.offset_type.lower() == 'latest':
            start_offset = OffsetType.LATEST
        else:
            # 引用kafka库，解决pykafka fetch_offset_limits函数不能正确根据timestamp返回offset的问题
            start_offset = OffsetType.LATEST
            consumer = KafkaConsumer(self.topic_name, group_id=self.group_id, bootstrap_servers=[self.kafka_address])
            tp = TopicPartition(self.topic_name, self.partition_id)
            offsets  = consumer.offsets_for_times({tp:int(self.offset_type)})
            if offsets[tp]:
                if offsets[tp].offset == 0:
                    start_offset = OffsetType.EARLIEST
                else:
                    committed = consumer._coordinator.fetch_committed_offsets([tp])
                    if not committed or (committed[tp] and committed[tp].offset < offsets[tp].offset):
                        start_offset = offsets[tp].offset - 1
                        reset_offset_on_start_status = True

        logger.info("consumer start offset on partition {} is {}".format(self.partition_id, start_offset))

        consumer = topic.get_simple_consumer(consumer_group=self.group_id,
                                             partitions={partitions.get(self.partition_id)},
                                             consumer_timeout_ms=self.consumer_timeout_ms,
                                             auto_commit_enable=False,
                                             auto_offset_reset=start_offset,
                                             reset_offset_on_start=reset_offset_on_start_status,
                                             )

        try:
            while True:
                msg = consumer.consume()
                if msg:
                    msg_consumed_count += 1
                    f.write(msg.value)
                    f.write("\n")
                if os.path.getsize(local_path) >= self.partition_max_to_cos_bytes:
                    logger.info("already reach partition_max_to_cos_bytes, file length: %s",
                                str(os.path.getsize(local_path)))
                    status = self.upload_local_file(local_path)
                    if status is False:
                        print("partition_max_to_cos_bytes failed to cos  time:" + str(int(time.time())))
                        return "partition_max_to_cos_bytes failed to cos"
                    consumer.commit_offsets()
                    f.seek(0)
                    f.truncate()
                if int(time.time()) - start_time >= self.partition_max_timeout_ms / 1000 - max_to_cos_time:
                    logger.info("already reach partition_max_timeout, cost time: %s",
                                str(int(time.time()) - start_time))
                    break
                if msg is None:
                    logger.info("already reach kafka consumer timeout, cost_time: %s",
                                str(int(time.time()) - start_time))
                    break

            f.close()
            logger.info("consumer finished, cost time: %s", str(int(time.time()) - start_time))
            logger.info("msg num: %s", str(msg_consumed_count))
            if msg_consumed_count > 0:
                status = self.upload_local_file(local_path)
                if status is False:
                    logger.error("failed to cos  time: %s", str(int(time.time())))
                    return "failed to cos"
            consumer.commit_offsets()
            consumer.stop()
            self.delete_local_file(local_path)
            logger.info("end time:%s", str(int(time.time())))
            return "success"
        except ConsumerStoppedException as err:
            logger.error("error:", str(err))
            logger.error("KafkaError failed consumer cost time: %s", str(int(time.time()) - int(start_time)))
            return "failed"


def main_handler(event, context):
    secret_id = os.getenv("TENCENTCLOUD_SECRETID")
    secret_key = os.getenv("TENCENTCLOUD_SECRETKEY")
    token = os.getenv("TENCENTCLOUD_SESSIONTOKEN")
    group_id = context["function_name"]
    partition_max_timeout_ms = context["time_limit_in_ms"]
    partition_id = event["partition_id"]

    # 下面这些都需要环境变量形式传入
    region = os.getenv("region")
    topic_name = os.getenv("topic_name")
    topic_id = os.getenv("topic_id")
    kafka_instance_id = os.getenv("kafka_instance_id")
    kafka_address = os.getenv("kafka_address")
    bucket_address = os.getenv("bucket_address")
    partition_max_to_cos_bytes = os.getenv("partition_max_to_cos_bytes")
    consumer_timeout_ms = os.getenv("consumer_timeout_ms")
    offset_type = os.getenv("offset_type")

    kafka_to_cos = KafkaToCos(kafka_instance_id, topic_name, topic_id, kafka_address, bucket_address,
                              partition_max_to_cos_bytes,
                              partition_max_timeout_ms,
                              partition_id,
                              consumer_timeout_ms,
                              group_id,
                              offset_type,
                              region,
                              secret_id,
                              secret_key,
                              token
                              )
    err = kafka_to_cos.param_check()
    if err != "":
        logger.error("param error: %s", err)
    ret_msg = kafka_to_cos.worker()
    return ret_msg


if __name__ == "__main__":
    main_handler(None, None)
