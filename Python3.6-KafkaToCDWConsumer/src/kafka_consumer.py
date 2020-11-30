import time
import logging
from io import StringIO
from pykafka.exceptions import ConsumerStoppedException
from pykafka.client import KafkaClient
from pykafka.common import OffsetType

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

class KafkaConsumer(object):
    
    def __init__(self, topic_name: str, kafka_address: str, partition_id: int, group_id: str, offset_type: str, consumer_timeout_ms: int):
        self.topic_name = topic_name
        self.kafka_address = kafka_address
        self.partition_id = partition_id
        self.group_id = group_id
        self.offset_type = offset_type
        self.consumer_timeout_ms = consumer_timeout_ms

        self.consumer = None
        self.sio = StringIO()
        self.msg_consumed_count = 0

    def __del__(self):
        self.sio.close()

    def commit(self):
        if self.consumer is not None:
            self.consumer.commit_offsets()
            self.consumer.stop()

    def consume(self, max_consume_count: int):
        start_time = int(time.time())

        client = KafkaClient(hosts=self.kafka_address)
        reset_offset_on_start_status = False
        topic = client.topics[self.topic_name.encode()]
        partitions = topic.partitions

        if self.offset_type.lower() == 'earliest':
            start_offset = OffsetType.EARLIEST
        elif self.offset_type.lower() == 'latest':
            start_offset = OffsetType.LATEST
        else:
            offsets = topic.fetch_offset_limits(int(self.offset_type))
            if len(offsets[self.partition_id].offset) == 0:
                start_offset = OffsetType.LATEST
            else:
                start_offset = offsets[self.partition_id].offset[0]
                reset_offset_on_start_status = True

        self.consumer = topic.get_simple_consumer(consumer_group=self.group_id, 
                                             partitions={partitions.get(self.partition_id)},
                                             consumer_timeout_ms=self.consumer_timeout_ms,
                                             auto_commit_enable=False,
                                             auto_offset_reset=start_offset,
                                             reset_offset_on_start=reset_offset_on_start_status,
                                            )

        try:
            while True:
                msg = self.consumer.consume()
                if msg:
                    self.msg_consumed_count += 1
                    self.sio.write(str(msg.value, encoding = "utf-8"))
                    self.sio.write('\n')
                if msg is None:
                    logger.info("already reach kafka consumer timeout, should be no msg")
                    break
                if self.msg_consumed_count >= max_consume_count:
                    logger.info("already reach max_consume_count:[%d], consume next time", max_consume_count)
                    break

            logger.info("consumer success, consume msg num: [%d], cost time: [%ds]", self.msg_consumed_count, int(time.time()) - start_time)
        except ConsumerStoppedException as e:
            logger.info("consumer fail, cost time: [%ds], error msg:[%s]", int(time.time()) - int(start_time), e) 
        finally:
            # file write会偏移pos，导致无法读取数据
            self.sio.seek(0)