#!/usr/bin/python
# -*- coding: utf-8 -*-


import time
import base64

class Queue:
    def __init__(self, queue_name, cmq_client, debug=False): 
        self.queue_name = queue_name
        self.cmq_client = cmq_client
        self.set_encoding(False)
        self.debug = debug

    def set_debug(self, debug):
        self.debug = debug

    def set_encoding(self, encoding):
        """ 设置是否对消息体进行base64编码
 
            @type encoding: bool
            @param encoding: 是否对消息体进行base64编码
        """
        self.encoding = encoding
        
    def create(self, queue_meta):
        """ 创建队列

            @type queue_meta: QueueMeta object
            @param queue_meta: QueueMeta对象，设置队列的属性
        """
        params = {
            'queueName':self.queue_name,
            'pollingWaitSeconds':queue_meta.pollingWaitSeconds,
            'visibilityTimeout':queue_meta.visibilityTimeout,
            'maxMsgSize':queue_meta.maxMsgSize,
            'msgRetentionSeconds':queue_meta.msgRetentionSeconds,
            'rewindSeconds':queue_meta.rewindSeconds
        }
        if queue_meta.maxMsgHeapNum > 0:
            params['maxMsgHeapNum'] = queue_meta.maxMsgHeapNum
        self.cmq_client.create_queue(params)

    def rewindQueue(self, backTrackingTime):
        '''
        rewind queue
        @type backTrackingTime the back tracking time 
        '''
        params = {
              'queueName' : self.queue_name,
              'startConsumeTime':backTrackingTime
        }
        self.cmq_client.rewindQueue(params)
    
    def get_attributes(self):
        """ 获取队列属性

            @rtype: QueueMeta object
            @return 队列的属性
        """
        params = {
            'queueName':self.queue_name
        }
        resp = self.cmq_client.get_queue_attributes(params)
        queue_meta = QueueMeta()
        queue_meta.queueName = self.queue_name
        self.__resp2meta__(queue_meta, resp)
        return queue_meta

    def set_attributes(self, queue_meta):
        """ 设置队列属性

            @type queue_meta: QueueMeta object
            @param queue_meta: QueueMeta对象，设置队列的属性
        """
        params = {
            'queueName':self.queue_name,
            'pollingWaitSeconds':queue_meta.pollingWaitSeconds,
            'visibilityTimeout':queue_meta.visibilityTimeout,
            'maxMsgSize':queue_meta.maxMsgSize,
            'msgRetentionSeconds':queue_meta.msgRetentionSeconds,
            'rewindSeconds':queue_meta.rewindSeconds
        }
        if queue_meta.maxMsgHeapNum > 0:
            params['maxMsgHeapNum'] = queue_meta.maxMsgHeapNum
            
        self.cmq_client.set_queue_attributes(params)
            
            
    def delete(self):
        """ 删除队列

        """
        params = {'queueName':self.queue_name}
        self.cmq_client.delete_queue(params)

    def send_message(self, message, delayTime = 0):
        """ 发送消息

            @type message: Message object
            @param message: 发送的Message object

            @rtype: Message object
            @return 消息发送成功的返回属性，包含MessageId

        """
        if self.encoding:
            msgBody = base64.b64encode(message.msgBody)
        else:
            msgBody = message.msgBody
        params = {
            'queueName':self.queue_name,
            'msgBody':msgBody,
            'delaySeconds':delayTime,
        }
        msgId = self.cmq_client.send_message(params)
        retmsg = Message()
        retmsg.msgId = msgId
        return retmsg

    def batch_send_message(self, messages, delayTime = 0):
        """ 批量发送消息
           
           @type messages: list of Message object
           @param messages: 发送的Message object list

           @rtype: list of Message object
           @return 多条消息发送成功的返回属性，包含MessageId
        """
        params = {
            'queueName':self.queue_name,
            'delaySeconds':delayTime,
        }
        n = 1
        for message in messages:
            key = 'msgBody.%d' % n
            if self.encoding:
                params[key] = base64.b64encode(message.msgBody)
            else:
                params[key] = message.msgBody
            n += 1
        msgList = self.cmq_client.batch_send_message(params)
        retMessageList = []
        for msg in msgList:
            retmsg = Message()
            retmsg.msgId = msg['msgId']
            retMessageList.append(retmsg)
        return retMessageList
    

    def receive_message(self, polling_wait_seconds=None):
        """ 消费消息

            @type polling_wait_seconds: int
            @param polling_wait_seconds: 本次请求的长轮询时间，单位：秒

            @rtype: Message object
            @return Message object中包含基本属性、临时句柄
        """
        params = {'queueName':self.queue_name}
        if polling_wait_seconds != None:
            params['UserpollingWaitSeconds'] = polling_wait_seconds
            params['pollingWaitSeconds'] = polling_wait_seconds
        else:
            params['UserpollingWaitSeconds'] = str(30)
        resp = self.cmq_client.receive_message(params)
        msg = Message()
        if self.encoding:
            msg.msgBody = base64.b64decode(resp['msgBody'])
        else:
            msg.msgBody = resp['msgBody']
        msg.msgId = resp['msgId']
        msg.receiptHandle = resp['receiptHandle']
        msg.enqueueTime = resp['enqueueTime']
        msg.nextVisibleTime = resp['nextVisibleTime']
        msg.dequeueCount = resp['dequeueCount']
        msg.firstDequeueTime = resp['firstDequeueTime']
        return msg
   
    def batch_receive_message(self, num_of_msg, polling_wait_seconds=None):
        """ 批量消费消息

            @type num_of_msg: int
            @param num_of_msg: 本次请求最多获取的消息条数

            @type polling_wait_seconds: int
            @param polling_wait_seconds: 本次请求的长轮询时间，单位：秒

            @rtype: list of Message object
            @return 多条消息的属性，包含消息的基本属性、临时句柄
        """
        params = {'queueName':self.queue_name, 'numOfMsg':num_of_msg}
        if polling_wait_seconds != None:
            params['UserpollingWaitSeconds'] = polling_wait_seconds
            params['pollingWaitSeconds'] = polling_wait_seconds
        else:
            params['UserpollingWaitSeconds'] = str(30)
        msgInfoList = self.cmq_client.batch_receive_message(params)
        retMessageList = []
        for msg in msgInfoList:
            retmsg = Message()
            if self.encoding:
                retmsg.msgBody = base64.b64decode(msg['msgBody'])
            else:
                retmsg.msgBody = msg['msgBody']
            retmsg.msgId = msg['msgId']
            retmsg.receiptHandle = msg['receiptHandle']
            retmsg.enqueueTime = msg['enqueueTime']
            retmsg.nextVisibleTime = msg['nextVisibleTime']
            retmsg.dequeueCount = msg['dequeueCount']
            retmsg.firstDequeueTime = msg['firstDequeueTime']
            retMessageList.append(retmsg)
        return retMessageList

    def delete_message(self, receipt_handle):
        """ 删除消息

            @type receipt_handle: string
            @param receipt_handle: 最近一次操作该消息返回的临时句柄
        """
        params = {'queueName':self.queue_name, 'receiptHandle':receipt_handle}
        self.cmq_client.delete_message(params)

    def batch_delete_message(self, receipt_handle_list):
        """批量删除消息
            
            @type receipt_handle_list: list
            @param receipt_handle_list: batch_receive_message返回的多条消息的临时句柄
        """
        params = {'queueName':self.queue_name}
        n = 1
        for receipt_handle in receipt_handle_list:
            key = 'receiptHandle.%d' % n
            params[key] = receipt_handle
            n += 1
        self.cmq_client.batch_delete_message(params)

    
    def __resp2meta__(self, queue_meta, resp):
        if 'queueName' in list(resp.keys()):
            queue_meta.queueName = resp['queueName']
        if 'maxMsgHeapNum' in list(resp.keys()):
            queue_meta.maxMsgHeapNum = resp['maxMsgHeapNum']
        if 'pollingWaitSeconds' in list(resp.keys()):
            queue_meta.pollingWaitSeconds = resp['pollingWaitSeconds']
        if 'visibilityTimeout' in list(resp.keys()):
            queue_meta.visibilityTimeout = resp['visibilityTimeout']
        if 'maxMsgSize' in list(resp.keys()):
            queue_meta.maxMsgSize = resp['maxMsgSize']
        if 'msgRetentionSeconds' in list(resp.keys()):
            queue_meta.msgRetentionSeconds = resp['msgRetentionSeconds']
        if 'createTime' in list(resp.keys()):
            queue_meta.createTime = resp['createTime']
        if 'lastModifyTime' in list(resp.keys()):
            queue_meta.lastModifyTime = resp['lastModifyTime']
        if 'activeMsgNum' in list(resp.keys()):
            queue_meta.activeMsgNum = resp['activeMsgNum']
        if 'inactiveMsgNum' in list(resp.keys()):
            queue_meta.inactiveMsgNum = resp['inactiveMsgNum']
        if 'rewindSeconds' in list(resp.keys()):
            queue_meta.rewindSeconds = resp['rewindSeconds']
        if 'rewindmsgNum' in list(resp.keys()):
            queue_meta.rewindmsgNum = resp['rewindmsgNum']
        if 'minMsgTime' in list(resp.keys()):
            queue_meta.minMsgTime = resp['minMsgTime']
        if 'delayMsgNum' in list(resp.keys()):
            queue_meta.delayMsgNum = resp['delayMsgNum']

class QueueMeta:
    # DEFAULT_MAX_MSG_HEAP_NUM = 30
    DEFAULT_POLLING_WAIT_SECONDS = 0
    DEFAULT_VISIBILITY_TIMEOUT = 30
    DEFAULT_MAX_MSG_SIZE = 65536
    DEFAULT_MSG_RETENTION_SECONDS = 345600
    def __init__(self):
        """ 队列属性
            @note: 设置属性
            :: maxMsgHeapNum: 最大堆积消息数
            :: pollingWaitSeconds: receive message时，长轮询时间，单位：秒
            :: visibilityTimeout: 消息可见性超时, 单位：秒
            :: maxMsgSize: 消息最大长度, 单位：Byte
            :: msgRetentionSeconds: 消息保留周期，单位：秒
            :: rewindSeconds:消息回溯时间，单位：秒， 取值范围0-43200
            
            @note: 非设置属性
            :: activeMsgNum: 可消费消息数，近似值
            :: inactiveMsgNum: 正在被消费的消息数，近似值
            :: createTime: queue创建时间，单位：秒 
            :: lastModifyTime: 修改queue属性的最近时间，单位：秒
            :: queue_name: 队列名称
            :: rewindmsgNum: 已删除，但是还在回溯保留时间内的消息数量
            :: minMsgTime: 消息最小未消费时间，单位：秒
            :: delayMsgNum: 延时消息数量
        """
        
        self.queueName = ""
        self.maxMsgHeapNum = -1
        self.pollingWaitSeconds = QueueMeta.DEFAULT_POLLING_WAIT_SECONDS
        self.visibilityTimeout = QueueMeta.DEFAULT_VISIBILITY_TIMEOUT
        self.maxMsgSize = QueueMeta.DEFAULT_MAX_MSG_SIZE
        self.msgRetentionSeconds = QueueMeta.DEFAULT_MSG_RETENTION_SECONDS
        self.createTime = -1
        self.lastModifyTime = -1
        self.activeMsgNum = -1
        self.inactiveMsgNum = -1
        self.rewindSeconds  = 0
        self.rewindmsgNum = 0
        self.minMsgTime = 0
        self.delayMsgNum = 0 

    def __str__(self):
        meta_info = {"visibilityTimeout" : self.visibilityTimeout,
                     "maxMsgHeapNum" : self.maxMsgHeapNum,
                     "maxMsgSize" : self.maxMsgSize,
                     "msgRetentionSeconds" : self.msgRetentionSeconds,
                     "pollingWaitSeconds" : self.pollingWaitSeconds,
                     "activeMsgNum" : self.activeMsgNum,
                     "inactiveMsgNum" : self.inactiveMsgNum,
                     "createTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.createTime)),
                     "lastModifyTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.lastModifyTime)),
                     "QueueName" : self.queueName,
                     "rewindSeconds":self.rewindSeconds,
                     "rewindmsgNum":self.rewindmsgNum,
                     "minMsgTime":self.minMsgTime,
                     "delayMsgNum":self.delayMsgNum}
        return "\n".join(["%s: %s" % (k.ljust(30), v) for k, v in list(meta_info.items())])

class Message:
    def __init__(self, message_body="", message_tag=[]):
        """ 消息属性

            @note: send_message 指定属性
            :: msgBody         消息体 

            @note: send_message 返回属性
            :: msgId           消息编号

            @note: receive_message 返回属性，除基本属性外
            :: receiptHandle       下次删除或修改消息的临时句柄
            :: enqueueTime         消息入队时间
            :: nextVisibleTime     下次可被再次消费的时间
            :: dequeueCount        总共被消费的次数
            :: firstDequeueTime    第一次被消费的时间
            :: msgTag              消息标签
        """
        self.msgBody = message_body
        self.msgId = ""
        self.enqueueTime = -1
        self.receiptHandle = ""
        self.nextVisibleTime = -1
        self.dequeueCount = -1
        self.firstDequeueTime = -1
        self.msgTag = message_tag

    def __str__(self):
        msg_info = {"msgBody" : self.msgBody,
                     "msgId" : self.msgId,
                     "enqueueTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.enqueueTime)),
                     "nextVisibleTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.nextVisibleTime)),
                     "firstDequeueTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.firstDequeueTime)),
                     "dequeueCount" : self.dequeueCount,
                     "receiptHandle" : self.receiptHandle,
                     "msgTag":self.msgTag}
        return "\n".join(["%s: %s" % (k.ljust(30), v) for k, v in list(msg_info.items())])
    
    
