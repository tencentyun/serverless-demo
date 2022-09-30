#!/usr/bin/python
# -*- coding: utf-8 -*-

from cmq.cmq_client import CMQClient
from .queue import Queue
from cmq.cmq_tool import CMQLogger
from cmq.topic import Topic
from cmq.subscription import Subscription
class Account:
    """
    Account类对象不是线程安全的，如果多线程使用，需要每个线程单独初始化Account类对象
    """
    def __init__(self, host, secretId, secretKey, debug=False):
        """
            @type host: string
            @param host: 访问的url，例如：https://cmq-queue-gz.api.qcloud.com

            @type secretId: string
            @param secretId: 用户的secretId, 腾讯云官网获取

            @type secretKey: string
            @param secretKey: 用户的secretKey，腾讯云官网获取

            @note: Exception
            :: CMQClientParameterException host格式错误
        """
        self.secretId = secretId
        self.secretKey = secretKey
        self.debug = debug
        self.logger = CMQLogger.get_logger()
        self.cmq_client = CMQClient(host, secretId, secretKey, logger=self.logger)
        
    def set_sign(self, sign='sha256'):
        '''
          @fucntion set_sign : set sign method 
          @sign  sha256 or sha1 
        '''
        self.cmq_client.set_sign_method(sign)
    def set_debug(self, debug):
        self.debug = debug

    def set_log_level(self, log_level):
        """ 设置logger的日志级别
            @type log_level: int
            @param log_level: one of logging.DEBUG,logging.INFO,logging.WARNING,logging.ERROR,logging.CRITICAL
        """
        CMQLogger.validate_loglevel(log_level)
        self.logger.setLevel(log_level)
        self.cmq_client.set_log_level(log_level)

    def close_log(self):
        """ 关闭日志打印
        """
        self.cmq_client.close_log()


    def set_client(self, host, secretId=None, secretKey=None):
        """ 设置访问的url

            @type host: string
            @param host: 访问的url，例如：http://cmq-queue-gz.api.tencentyun.com

            @type secretId: string
            @param secretId: 用户的secretId，腾讯云官网获取

            @type secretKey: string
            @param secretKey: 用户的secretKey，腾讯云官网获取

            @note: Exception
            :: CMQClientParameterException host格式错误
        """
        if secretId is None:
            secretId = self.secretId
        if secretKey is None:
            secretKey = self.secretKey
        self.cmq_client = CMQClient(host, secretId, secretKey, logger=self.logger)

    def get_queue(self, queue_name):
        """ 获取Account的一个Queue对象

            @type queue_name: string
            @param queue_name: 队列名

            @rtype: Queue object
            @return: 返回该Account的一个Queue对象
        """
        return Queue(queue_name, self.cmq_client, self.debug)

    def get_client(self):
        """ 获取queue client

            @rtype: CMQClient object
            @return: 返回使用的CMQClient object
        """
        return self.cmq_client

    def list_queue(self, searchWord="", limit=-1, offset=""):
        
        """ 列出Account的队列

            @type searchWord: string
            @param searchWord: 队列名的前缀

            @type limit: int
            @param limit: list_queue最多返回的队列数

            @type offset: string
            @param offset: list_queue的起始位置，上次list_queue返回的next_offset

            @rtype: tuple
            @return: QueueURL的列表和下次list queue的起始位置; 如果所有queue都list出来，next_offset为"".
        """
        params = {}
        if searchWord != "":
            params['searchWord'] = searchWord
        if limit != -1:
            params['limit'] = limit
        if offset != "":
            params['offset'] = offset
        ret_pkg = self.cmq_client.list_queue(params)

        if offset == "":
            next_offset = len(ret_pkg['queueList'])
        else:
            next_offset = offset + len(ret_pkg['queueList'])
        if next_offset >= ret_pkg['totalCount']:
            next_offset = ""

        return (ret_pkg['totalCount'], ret_pkg['queueList'], next_offset)

    def get_topic(self, topicName):
        """get topic 
            @type topicName :string 
            @param topicName 
            @return Topic object
        """
        return Topic(topicName, self.cmq_client, self.debug)
    
    def list_topic(self, searchWord="", limit=-1, offset=""):
        
        """ 列出Account的主题

            @type searchWord: string
            @param searchWord: 主题名的前缀

            @type limit: int
            @param limit: list_topic最多返回的主题数

            @type offset: string
            @param offset: list_topic的起始位置，上次list_topic返回的next_offset

            @rtype: tuple
            @return: topicURL的列表和下次list topic的起始位置; 如果所有topic都list出来，next_offset为"".
        """
        params = {}
        if searchWord != "":
            params['searchWord'] = searchWord
        if limit != -1:
            params['limit'] = limit
        if offset != "":
            params['offset'] = offset
        ret_pkg = self.cmq_client.list_topic(params)

        if offset == "":
            next_offset = len(ret_pkg['topicList'])
        else:
            next_offset = offset + len(ret_pkg['topicList'])
        if next_offset >= ret_pkg['totalCount']:
            next_offset = ""

        return (ret_pkg['totalCount'], ret_pkg['topicList'], next_offset)

    
    def get_subscription(self, topicName, subscriptionName):
        ''' 获取订阅
            @type topicName :string
            @param topicName
            
            @type subscriptionName :string
            @param subscriptionName:
            
            @return Subscription object
        
        '''
        return Subscription(topicName, subscriptionName, self.cmq_client, self.debug)
    
    
    

    
    def debuginfo(self, RequestId):
        if self.debug:
            print("===================DEBUG INFO===================")
            print("RequestId: %s" % RequestId)
            print("================================================")
      
	
