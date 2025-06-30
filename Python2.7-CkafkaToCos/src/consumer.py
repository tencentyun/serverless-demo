#!/usr/bin/python
# -*- coding: UTF-8 -*-
import os
import sys
import time
import datetime
import pytz
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosClientError, CosServiceError
from pykafka.client import KafkaClient as PyKafkaClient
from pykafka.common import OffsetType as PyKafkaOffsetType
from pykafka.exceptions import SocketDisconnectedError, ConsumerStoppedException, MessageSetDecodeFailure
from kafka import KafkaConsumer, TopicPartition

file_byte_up_limit = 1024 * 1024 * 500  # 每次最大投递cos包大小 500M
file_byte_down_limit = 1  # 每次最小投递cos包大小 1B
init_cos_upload_speed = 1024 * 1024 * 10  # 初始化上传cos速度 10MB/s
default_consumer_timeout_ms = 3000  # 默认partition多久时间没消息就退出, 3000毫秒
return_buffer_time_s = 5  # 预留5秒函数退出时间

logger = logging.getLogger()
logger.setLevel(level=logging.DEBUG)

def consumer_worker(event, context, start_time):
    # 获取环境变量
    instance_id = os.getenv("instance_id")
    topic_id = os.getenv("topic_id")
    topic_name = os.getenv("topic_name")
    kafka_address = os.getenv("kafka_address")
    bucket_address = os.getenv("bucket_address")
    once_max_to_cos_bytes = int(os.getenv("once_max_to_cos_bytes"))
    offset_type = os.getenv("offset_type")
    file_path_prefix = os.getenv("file_path_prefix")
    # 实例化一个认证对象，入参需要传入腾讯云账户临时secret_id，secret_key, token
    region = os.getenv("region")
    secret_id = os.getenv("TENCENTCLOUD_SECRETID")
    secret_key = os.getenv("TENCENTCLOUD_SECRETKEY")
    token = os.getenv("TENCENTCLOUD_SESSIONTOKEN")
    # 获取函数配置信息
    group_id = context["function_name"]
    function_timeout_ms = context["time_limit_in_ms"]
    request_id = context["request_id"]
    # 获取函数触发请求参数, 指定partition_id
    partition_id = event["partition_id"]

    kafka_to_cos = KafkaToCos(start_time, request_id, instance_id, topic_name, topic_id, kafka_address, bucket_address,
                              file_path_prefix, once_max_to_cos_bytes, function_timeout_ms, partition_id, 
                              group_id, offset_type, region, secret_id, secret_key, token)
    err = kafka_to_cos.param_check()
    if err != "":
        logger.error("param error: %s", err)
    ret_msg = kafka_to_cos.worker()
    return ret_msg


class KafkaToCos(object):
    '''
    消费kafka 投递cos
    '''

    def __init__(self, start_time, request_id, kafka_instance_id, topic_name, topic_id, kafka_address, bucket_address, 
                 file_path_prefix, once_max_to_cos_bytes, function_timeout_ms, partition_id, 
                 group_id, offset_type, region, secret_id, secret_key, token=None):
        self.start_time = start_time
        self.request_id = request_id
        self.kafka_instance_id = kafka_instance_id
        self.topic_name = topic_name
        self.topic_id = topic_id
        self.kafka_address = kafka_address
        self.bucket_address = bucket_address
        self.file_path_prefix = file_path_prefix
        self.once_max_to_cos_bytes = once_max_to_cos_bytes
        self.function_timeout_ms = function_timeout_ms
        self.partition_id = partition_id
        self.group_id = group_id
        self.offset_type = offset_type
        config = CosConfig(Region=region, SecretId=secret_id, SecretKey=secret_key, Token=token)  # 获取配置对象
        self.cos_client = CosS3Client(config)
        self.cos_upload_speed = float(init_cos_upload_speed)
        self.start_offset = PyKafkaOffsetType.EARLIEST

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
            if self.once_max_to_cos_bytes is None:
                return "once_max_to_cos_bytes is empty"
            if self.offset_type is None:
                self.offset_type = "earliest"

            # 验证once_max_to_cos_bytes 取值
            self.once_max_to_cos_bytes = int(self.once_max_to_cos_bytes)
            if self.once_max_to_cos_bytes > file_byte_up_limit:
                self.once_max_to_cos_bytes = file_byte_up_limit
            if self.once_max_to_cos_bytes <= 0:
                self.once_max_to_cos_bytes = file_byte_down_limit

            return ""
        except CosClientError as err:
            return str(err)

    # Generating file name. 生成写入文件名, 格式为kafka_instance_id/topic_id/date/timestamp_request_id
    def object_key_generate(self):
        logger.info("%s: start to generate key", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        today = str(datetime.date.today())
        file_name = "{}_{}".format(str(int(round(time.time() * 1000))), str(self.request_id))
        # 若指定路径则选择指定路径,若无指定路径则为根目录
        if str(self.file_path_prefix) == "":
            dir_name = "{}/{}/{}".format(str(self.kafka_instance_id), str(self.topic_id), today)
        else:
            dir_name = "{}/{}/{}/{}".format(str(self.file_path_prefix), str(self.kafka_instance_id), str(self.topic_id),
                                            today)
        object_key = '{}/{}'.format(dir_name, file_name)
        logger.info("%s: key generated, key=%s", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), object_key)
        return object_key

    # Check if the file already exists. 检查文件是否已存在
    def check_cos_file_exist(self, key):
        logger.info("%s: start to check key existence", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        exist = False
        try:
            if self.cos_client.object_exists(Bucket=self.bucket_address, Key=key):
                exist = True
        except CosServiceError as e:
            logger.error("Check object exists error:%s", str(e))
        logger.info("%s: key existence %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), str(exist))
        return exist

    # Deleting local file. 删除本地文件
    def delete_local_file(self, src):
        logger.info("%s: delete files and folders", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        try:
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

    # update speed of uploading file to cos
    def update_cos_upload_speed(self, size, cost):
        if cost == 0:
            cost = 1
        self.cos_upload_speed = float(size)/cost
        logger.info("%s: update cos_upload_speed to %sMB/s", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')),
                    str(self.cos_upload_speed/1024/1024))

    # Uploading file to COS. 上传文件到COS, 返回True代表进行commit操作, 返回False则代表退出
    def upload_local_file(self, local_path):
        upload_start_time = int(time.time())
        logger.info("%s: Start upload file to COS...", str(datetime.datetime.fromtimestamp(upload_start_time,
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        if os.path.getsize(local_path) <= 0:
            logger.info("local file is empty")
            return False
        # 如果上传文件会导致函数超时, 则不上传也不commit, 等待下次触发再次重新消费
        if float(os.path.getsize(local_path)) / self.cos_upload_speed + return_buffer_time_s + int(time.time()) >= \
                self.start_time + self.function_timeout_ms:
            logger.info("upload file may meet function timeout, cancel upload file, cancel commit, "
                        "time: %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
            return False
        # 判断文件名是否存在
        if os.path.isfile(local_path):
            logger.info("local_filename is [%s], size is [%s]MB", str(local_path),
                        float(os.path.getsize(local_path)) / 1024 / 1024)
            key = self.object_key_generate()
            # 如果文件名已经存在, 则再次生成新的文件名
            while self.check_cos_file_exist(key) is True:
                key = self.object_key_generate()
            # 简单上传,STANDARD_IA：低频存储
            response = self.cos_client.put_object_from_local_file(Bucket=self.bucket_address, LocalFilePath=local_path,
                                                              Key=key, StorageClass="STANDARD_IA")
            upload_cost = int(time.time()) - upload_start_time
            self.update_cos_upload_speed(size=float(os.path.getsize(local_path)), cost=upload_cost)
            logger.info("%s: upload to COS cost: %s second, result is [%s]", str(datetime.datetime.fromtimestamp(
                        int(time.time()), pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')),
                        str(upload_cost), response)
            # 检查COS文件是否上传成功
            if self.check_cos_file_exist(key):
                logger.info("%s: Upload file to COS succeed...", str(datetime.datetime.fromtimestamp(int(time.time()),
                            pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
                return True
        logger.error("!!!Upload file to COS failed!!!")
        return False

    # set start offset of consumer, 返回值代表是否要重置offset
    def set_start_offset(self):
        logger.info("%s: Start set start offset...", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        reset_flag = False
        if self.offset_type.lower() == 'earliest':
            self.start_offset = PyKafkaOffsetType.EARLIEST
            logger.info("earliest was choose, consumer group will consume from the earliest offset(-2)")
        elif self.offset_type.lower() == 'latest':
            self.start_offset = PyKafkaOffsetType.LATEST
            logger.info("latest was choose, consumer group will consume from the latest offset(-1)")
        else:
            # 引用另一个kafka库，解决pykafka库fetch_offset_limits函数不能正确根据timestamp返回offset的问题
            consumer = KafkaConsumer(self.topic_name, group_id=self.group_id, bootstrap_servers=[self.kafka_address])
            try:
                tp = TopicPartition(self.topic_name, self.partition_id)
                offsets = consumer.offsets_for_times({tp:int(self.offset_type)})
                logger.info("timestamp(%s=%s) was choose, consumer group will consume from the offset(%s)",
                            str(self.offset_type), str(datetime.datetime.fromtimestamp(int(self.offset_type),
                            pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), str(offsets[tp].offset))
                if offsets[tp]:
                    if offsets[tp].offset == 0:
                        logger.info("offsets[tp].offset == 0, set start_offset=OffsetType.EARLIEST")
                        self.start_offset = PyKafkaOffsetType.EARLIEST
                    else:
                        committed = consumer._coordinator.fetch_committed_offsets([tp])
                        if not committed or (committed[tp] and committed[tp].offset < offsets[tp].offset):
                            if not committed:
                                logger.info("Note! no committed record from consumer group(%s), reset offset to %s",
                                            self.group_id, str(offsets[tp].offset))
                            else:
                                logger.info("Note! committed offset is %s, reset offset to %s)",
                                            str(committed[tp].offset), str(offsets[tp].offset))
                            # 重置offset
                            self.start_offset = offsets[tp].offset - 1
                            reset_flag = True
            except Exception as e:
                logger.error("KafkaConsumer err:%s", str(e))
            finally:
                consumer.close()
        logger.info("%s: start offset=%s, reset is %s", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), str(self.start_offset),
                    str(reset_flag))
        return reset_flag

    def worker(self):
        logger.info("%s: partition_id %s worker start...", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), str(self.partition_id))
        reset_offset_on_start_status = self.set_start_offset()

        # 使用pykafka库
        client = PyKafkaClient(hosts=self.kafka_address)
        topic = client.topics[self.topic_name.encode()]
        partitions = topic.partitions
        py_consumer = topic.get_simple_consumer(consumer_group=self.group_id,
                                                partitions={partitions.get(self.partition_id)},
                                                consumer_timeout_ms=default_consumer_timeout_ms,
                                                auto_commit_enable=False,
                                                auto_offset_reset=self.start_offset,
                                                reset_offset_on_start=reset_offset_on_start_status)
        logger.info("%s: before consume, offsets:%s", str(datetime.datetime.fromtimestamp(int(time.time()),
                    pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), str(py_consumer.fetch_offsets()))
        local_path = '/tmp/local_file.txt'
        if os.path.exists(local_path):
            os.remove(local_path)
        os.mknod(local_path)
        f = open(local_path, 'w')
        total_msg_consumed = 0
        msg_consumed = 0
        retry_times = 0
        logger.info("%s: consumer start...", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
        try:
            while True:
                consumer_start_time = int(time.time())
                # 函数执行时间接近超时时间, 停止消费, 优雅退出
                if return_buffer_time_s*1000 + int(time.time()*1000) >= self.start_time*1000 + self.function_timeout_ms:
                    logger.info("%s: Attention! Function should return now!", str(datetime.datetime.fromtimestamp(
                        int(time.time()), pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
                    return "grace return"
                # 开始消费
                msg = py_consumer.consume()
                # 持续consumer_timeout_ms时间没有消息, 停止消费
                if msg is None:
                    logger.info("%s: already reach kafka consumer timeout, connect cost_time: %s",
                                str(datetime.datetime.fromtimestamp(int(time.time()),
                                pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')),
                                str(int(time.time()) - consumer_start_time))
                    break
                # 每消费到一条消息, 就写入临时文件
                total_msg_consumed += 1
                msg_consumed += 1
                f.write(msg.value)
                f.write("\n")
                # 如果kafka数据很多，且qps很大，可以删除强刷 提高效率
                f.flush()  # 强制刷新缓冲区
                os.fsync(f.fileno())  # 确保写入磁盘
                # 文件大小达到once_max_to_cos_bytes, 则上传文件
                if os.path.getsize(local_path) >= self.once_max_to_cos_bytes:
                    logger.info("%s: %s messages were consumed, file size: %sMB, already reach limit: %sMB...",
                                str(msg_consumed), str(datetime.datetime.fromtimestamp(int(time.time()),
                                pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')),
                                float(self.once_max_to_cos_bytes) / 1024 / 1024,
                                float(os.path.getsize(local_path)) / 1024 / 1024)
                    # 上传文件
                    if self.upload_local_file(local_path) is False:
                        logger.info("%s: something wrong, no commit, return...")
                        return "no commit return"
                    # 上传成功, 则进行commit
                    logger.info("%s: upload succeed, begin commit offset...",
                                str(datetime.datetime.fromtimestamp(int(time.time()),
                                pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
                    try:
                        py_consumer.commit_offsets()
                    except Exception as e:
                        logger.error("Error! Commit offset failed:%s", str(e))
                    f.seek(0)
                    f.truncate()
                    msg_consumed = 0

            if total_msg_consumed > 0:
                # 先判断上传是否会导致超时
                if os.path.getsize(local_path)/self.cos_upload_speed + return_buffer_time_s \
                        + int(time.time()) >= self.start_time + self.function_timeout_ms:
                    logger.info("%s: upload file may meet function timeout, cancel upload file",
                                str(datetime.datetime.fromtimestamp(int(time.time()),
                                pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
                    return "success"
                status = self.upload_local_file(local_path)
                if status is False:
                    logger.error("%s: upload to cos failed", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
                    return "failed to cos"
                logger.info("%s: total number of messages were consumed: %s, upload succeed, begin commit...",
                            str(datetime.datetime.fromtimestamp(int(time.time()),
                            pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')), str(total_msg_consumed))
                try:
                    py_consumer.commit_offsets()
                except Exception as e:
                    logger.error("Error! Commit offset failed:%s", str(e))
            logger.info("%s: consumer end, offsets:%s", str(datetime.datetime.fromtimestamp(int(time.time()),
                        pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')),
                        str(py_consumer.fetch_offsets()))
            return "success"

        except ConsumerStoppedException as err:
            logger.error("error:", str(err))
            logger.error("KafkaError failed consumer cost time: %s second", str(int(time.time())-int(self.start_time)))
            return "failed"

        except SocketDisconnectedError as e:
            logger.error("SocketDisconnectedError:%s", str(e))
            retry_times += 1
            if retry_times >= 3:
                return "SocketDisconnectedError"

        except MessageSetDecodeFailure as e:
            logger.error("Decode error:%s", str(e))
            retry_times += 1
            if retry_times >= 3:
                return "MessageSetDecodeFailure"

        except Exception as e:
            logger.error("Exception:%s", str(e))
            return "consume error"

        finally:
            logger.info("%s: consumer stop and delete temporary file, exit...", str(datetime.datetime.fromtimestamp(
                        int(time.time()), pytz.timezone('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')))
            py_consumer.stop()
            f.close()
            self.delete_local_file(local_path)
