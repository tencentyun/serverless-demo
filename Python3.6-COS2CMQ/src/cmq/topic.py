#!/usr/bin/env python
# coding=utf-8

import time
import base64

class Topic:

    def __init__(self, topicName, cmq_client,
                 debug=False):
        self.topicName = topicName
        self.cmq_client = cmq_client
        self.set_encoding(False)
        self.debug = debug
    
    def set_debug(self, debug):
        self.debug = debug


    def set_encoding(self, encoding):
        self.encoding = encoding
        
        
    def create(self, topic_meta):
        
        """ create topic

            @type topic_meta: TopicMeta object
        """
        params = {
            'topicName':self.topicName,
            'filterType':topic_meta.filterType,
        }
        
        if topic_meta.maxMsgSize > 0:
            params['maxMsgSize'] = topic_meta.maxMsgSize
        self.cmq_client.create_topic(params)
        
    
            
    def delete(self):
        ''' delete opic
               
        '''
        params = {
            "topicName" : self.topicName,
            }
        self.cmq_client.delete_topic(params)
        
    def get_attributes(self):
        """ get topic attributes 
            @return:  TopicMeta ojbect
        """
        params = {
            'topicName':self.topicName
        }
        resp = self.cmq_client.get_topic_attributes(params)
        topic_meta = TopicMeta()
        topic_meta.topicName = self.topicName
        self.__resp2meta__(topic_meta, resp)
        return topic_meta
    
    def set_attributes(self, topic_meta):
        """ set topic attributes
             @type TopicMeta object
        """
        params = {
            'topicName':self.topicName,
        }
        if topic_meta.maxMsgSize > 0:
            params['maxMsgSize'] = topic_meta.maxMsgSize
            
        self.cmq_client.set_topic_attributes(params)
        
    def publish_message(self, message, routingKey=""):
        """ send message

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
            'topicName':self.topicName,
            'msgBody':msgBody,
            'routingKey':routingKey
        }
        # for tags
         
        if message.msgTag:
            n = 1
            for tag in message.msgTag:
                key = 'msgTag.%d' % n
                params[key] = tag
                n += 1
            
        msgId = self.cmq_client.publish_message(params)
        retmsg = Message()
        retmsg.msgId = msgId
        return retmsg

    def batch_publish_message(self, messages,msgtag=[],routingKey= ""):
        """ 批量发送消息
           
           @type messages: list of Message object
           @param messages: 发送的Message object list

           @rtype: list of Message object
           @return 多条消息发送成功的返回属性，包含MessageId
        """
        params = {
            'topicName':self.topicName,
            'routingKey':routingKey,
        }
        
        n = 1
        for message in messages:
            msg = 'msgBody.%d' % n
            if self.encoding:
                params[msg] = base64.b64encode(message.msgBody)
            else:
                params[msg] = message.msgBody
            n+=1

        n = 1 
        for tag in msgtag:
            key = 'msgTag.%d' % n
            params[key] = tag
            n += 1 

        msgList = self.cmq_client.batch_publish_message(params)
        retMessageList = []
        for msg in msgList:
            retmsg = Message()
            retmsg.msgId = msg['msgId']
            retMessageList.append(retmsg)
        return retMessageList

    def list_subscription(self, searchWord="" , limit=-1, offset=""):
        '''列出Topic的订阅

            @type searchWord: string
            @param searchWord: 关键字

            @type limit: int
            @param limit: list_subscription最多返回的订阅数

            @type offset: string
            @param offset: list_subscription的起始位置，上次list_subscription返回的next_offset

            @rtype: tuple
            @return: subscriptionURL的列表和下次list subscription的起始位置; 如果所有subscription都list出来，next_offset为"".
        '''   
        params = {
            'topicName':self.topicName,
        }
        
        if searchWord != "":
            params['searchWord'] = searchWord;
        
        if limit != -1:
            params['limit'] = limit;
        
        if offset != "":
            params['offset'] = offset
        
        ret_pkg = self.cmq_client.list_subscription(params)
        
        if offset == "":
            next_offset = len(ret_pkg['subscriptionList'])
        else:
            next_offset = offset + len(ret_pkg['subscriptionList'])
        
        if next_offset >= ret_pkg['totalCount']:
            next_offset = ""
        
        return (ret_pkg['totalCount'], ret_pkg['subscriptionList'], next_offset)
      
    def __resp2meta__(self, topic_meta, resp):
        if 'msgCount' in list(resp.keys()):
            topic_meta.msgCount = resp['msgCount']
        if 'maxMsgSize' in list(resp.keys()):
            topic_meta.maxMsgSize = resp['maxMsgSize']
        if 'msgRetentionSeconds' in list(resp.keys()):
            topic_meta.msgRetentionSeconds = resp['msgRetentionSeconds']
        if 'createTime' in list(resp.keys()):
            topic_meta.createTime = resp['createTime']
        if 'lastModifyTime' in list(resp.keys()):
            topic_meta.lastModifyTime = resp['lastModifyTime']
        if 'filterType' in list(resp.keys()):
            topic_meta.filterType = resp['filterType']

        
class TopicMeta:
    '''
       :: topicName               topic name 
       :: msgCount                消息统计
       :: maxMsgSize              消息最大长度  可修改
       :: msgRetentionSeconds     消息保留时间
       :: createTime              创建时间
       :: lastModifyTime          上次修改实现
    '''
    def __init__(self):
        self.topicName = ""
        self.msgCount = 0
        self.maxMsgSize = 65536
        self.msgRetentionSeconds = 0
        self.createTime = 0
        self.lastModifyTime = 0
        self.filterType = 1
		
    def __str__(self):
        msg_info = { "topicName" : self.topicName,
                     "msgCount" : self.msgCount,
                     "createTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.createTime)),
                     "lastModifyTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.lastModifyTime)),
                     "maxMsgSize" : self.maxMsgSize,
                     "msgRetentionSeconds" : self.msgRetentionSeconds,
                     "filterType": self.filterType}
        return "\n".join(["%s: %s" % (k.ljust(30), v) for k, v in list(msg_info.items())])



class Message:
    def __init__(self, message_body="", message_tag=[]):
        """ 消息属性

            @note: send_message 指定属性
            :: msgBody         消息体 

            @note: send_message 返回属性
            :: msgId           消息编号

            @note: receive_message 返回属性，除基本属性外
            :: receiptHandle       下次删除或修改消息的临时句柄
            :: msgTag              消息标签
        """
        self.msgBody = message_body
        self.msgId = ""
        self.msgTag = message_tag

    def __str__(self):
        msg_info = {"msgBody" : self.msgBody,
                     "msgId" : self.msgId,
                     "msgTag":self.msgTag}
        return "\n".join(["%s: %s" % (k.ljust(30), v) for k, v in list(msg_info.items())])
    


