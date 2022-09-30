#!/usr/bin/python
# -*- coding: utf-8 -*-


import time
import base64
from mailcap import subst

class Subscription:
    def __init__(self, topicName, subscriptionName, cmq_client, debug=False):
        self.topicName = topicName
        self.subscriptionName = subscriptionName 
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
        
    def create(self, subscription_meta):
        """ 创建订阅

            @type queue_meta: QueueMeta object
            @param queue_meta: QueueMeta对象，设置队列的属性
        """
        params = {
            'topicName' : self.topicName,
            'subscriptionName':self.subscriptionName,
            'endpoint':subscription_meta.Endpoint,
            'protocol' :subscription_meta.Protocal,
            
            'notifyStrategy':subscription_meta.NotifyStrategy,
            'notifyContentFormat':subscription_meta.NotifyContentFormat,
        }
        if subscription_meta.bindingKey :
            n = 1 
            for tag in subscription_meta.bindingKey:
                key = 'bindingKey.%d' % n 
                params[key] = tag
                n += 1
         
        if subscription_meta.FilterTag:
            n = 1 
            for tag in subscription_meta.FilterTag:
                key = 'filterTag.%d' % n
                params[key] = tag
                n += 1         
        self.cmq_client.create_subscription(params)

    def get_attributes(self):
        """ 获取订阅属性

            @rtype: Subscription object
            @return 订阅属性
        """
        params = {
            'topicName':self.topicName,
            'subscriptionName':self.subscriptionName
        }
        resp = self.cmq_client.get_subscription_attributes(params)
        subscripution_meta = SubscriptionMeta()
        self.__resp2meta__(subscripution_meta, resp)
        return subscripution_meta

    def set_attributes(self, subscription_meta):
        """ 设置队列属性

            @type subscription_meta: 
            @param subscription_meta: 订阅属性对象，设置订阅属性
        """
        params = {
            'topicName':self.topicName,
            'subscriptionName':self.subscriptionName,
            }
        if subscription_meta.NotifyStrategy != "":
            params['notifyStrategy'] = subscription_meta.NotifyStrategy
        if subscription_meta.NotifyContentFormat != "":
            params['notifyContentFormat'] = subscription_meta.NotifyContentFormat

        if subscription_meta.bindingKey :
            n = 1 
            for tag in subscription_meta.bindingKey:
                key = 'bindingKey.%d' % n 
                params[key] = tag
                n += 1
         
        if subscription_meta.FilterTag :
            n = 1 
            for tag in subscription_meta.FilterTag:
                key = 'filterTag.%d' % n 
                params[key] = tag
                n += 1
                
        self.cmq_client.set_subscription_attributes(params)
            
    def delete(self):
        """ 删除订阅

        """
        params = {
            'topicName':self.topicName,
            'subscriptionName':self.subscriptionName}        
        self.cmq_client.delete_subscription(params)

    def clearFilterTags(self):
        """ clear filter tags

        """
        params = {
            'topicName':self.topicName,
            'subscriptionName':self.subscriptionName}
        
        self.cmq_client.clear_filterTags(params)
        
        
          
    def __resp2meta__(self, subscription_meta, resp):
        if 'topicOwner' in list(resp.keys()):
            subscription_meta.TopicOwner = resp['topicOwner']
        if 'endpoint' in list(resp.keys()):
            subscription_meta.maxMsgHeapNum = resp['endpoint']
        if 'protocal' in list(resp.keys()):
            subscription_meta.Protocal = resp['protocal']
        if 'notifyStrategy' in list(resp.keys()):
            subscription_meta.NotifyStrategy = resp['notifyStrategy']
        if 'notifyContentFormat' in list(resp.keys()):
            subscription_meta.NotifyContentFormat = resp['notifyContentFormat']
        if 'createTime' in list(resp.keys()):
            subscription_meta.createTime = resp['createTime']
        if 'lastModifyTime' in list(resp.keys()):
            subscription_meta.lastModifyTime = resp['lastModifyTime']
        if 'msgCount' in list(resp.keys()):
            subscription_meta.inactiveMsgNum = resp['msgCount']      
        if 'filterTags' in list(resp.keys()) and resp['filterTags'] is not None:
            for tag in resp['filterTags']:
                subscription_meta.FilterTag.append(tag)
        if 'bindingKey' in list(resp.keys()) and resp['bindingKey'] is not  None:
            for tag in resp['bindingKey']:
                subscription_meta.bindingKey.append(tag)
                

class SubscriptionMeta:
    def __init__(self):
        """ 订阅属性
            :: TopicOwner: 订阅的主题所有者appid
            :: Endpoint: 订阅的终端地址
                                             接收通知的endpoint，根据协议Protocol区分：
                                             对于http，endpoint必须以“http://”开头；
                                             对于https，endpoint必须以“https://”开头；
                                             对于queue，则填queueName。
            :: Protocal: 订阅的协议
            :: NotifyStrategy: 向Endpoint 推送消息的重试策略
                                             描述了向 Endpoint 推送消息出现错误时的重试策略。
                  BACKOFF_RETRY 或者 EXPONENTIAL_DECAY_RETRY，
                                            默认为BACKOFF_RETRY，重试策略的具体描述请参考 基本概念/NotifyStrategy
            :: NotifyContentFormat:  向endpoint端推送的消息格式
            :: FilterTage :该订阅中消息过滤的标签内容
            :: CreateTime :创建时间
            :: LastModifyTime :上次修改时间
            :: msgCount 消息数量
            

        """
        
        self.TopicOwner = ""
        self.Endpoint = ""
        self.Protocal = ""
        self.NotifyStrategy = "EXPONENTIAL_DECAY_RETRY"
        self.NotifyContentFormat = "JSON"
        self.FilterTag = []
        self.CreateTime = 0
        self.LastModifyTime = 0
        self.msgCount = 0     
        self.bindingKey=[]
    def __str__(self):
        meta_info = {"topicOwner" : self.TopicOwner,
                     "endpoint" : self.Endpoint,
                     "protocal" : self.Protocal,
                     "notifyStrategy" : self.NotifyStrategy,
                     "notifyContentFormat" : self.NotifyContentFormat,
                     "filterTag" : self.FilterTag,
                     "createTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.createTime)),
                     "lastModifyTime" : time.strftime("%Y/%m/%d %H:%M:%S", time.localtime(self.lastModifyTime)),
                     "msgCount":self.msgCount,
                     "bindingKey": self.bindingKey,}
        return "\n".join(["%s: %s" % (k.ljust(30), v) for k, v in list(meta_info.items())])


    
    
