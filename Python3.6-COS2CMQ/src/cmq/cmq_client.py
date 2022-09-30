#!/usr/bin/python
# -*- coding: utf-8 -*-

import urllib.request, urllib.parse, urllib.error
import copy
import random
from cmq.cmq_exception import *
from cmq.cmq_tool import CMQLogger
from cmq.cmq_http import CMQHttp, RequestInternal
from .sign import Sign
import json
import time
import sys

URISEC = '/v2/index.php'

class CMQClient:
    def __init__(self, host, secretId, secretKey, version="SDK_Python_1.3", logger=None):
        self.host, self.is_https = self.process_host(host)
        self.secretId = secretId
        self.secretKey = secretKey
        self.version = version
        self.logger = CMQLogger.get_logger() if logger is None else logger
        self.http = CMQHttp(self.host, logger=logger, is_https=self.is_https)
        self.sign_method = 'sha1'
        if self.logger:
            self.logger.debug("InitClient Host:%s Version:%s" % (host, version))
        self.method = 'POST'

    def set_method(self, method='POST'):
        """
        method: POST OR GET
        """
        self.method = method.upper()
    def set_sign_method(self, sign_method='sha1'):
        '''
        @function : set sign method , and current support sha1 and sha256 method 
        @sign_method :  sign method support sha1 and sha256
        @return none or exception for sign method 
        '''
        if sign_method == 'sha1' or sign_method == 'sha256':
            self.sign_method = sign_method
        else:
            raise CMQClientParameterException('Only support sha1 or sha256. invalid method:%s' % sign_method)
        
    def set_log_level(self, log_level):
        if self.logger:
            CMQLogger.validate_loglevel(log_level)
            self.logger.setLevel(log_level)
            self.http.set_log_level(log_level)

    def close_log(self):
        self.logger = None
        self.http.close_log()

    def set_connection_timeout(self, connection_timeout):
        self.http.set_connection_timeout(connection_timeout)

    def set_keep_alive(self, keep_alive):
        self.http.set_keep_alive(keep_alive)

    def close_connection(self):
        self.http.conn.close()

    def process_host(self, host):
        if host.startswith("http://"):
            if host.endswith("/"):
                host = host[:-1]
            host = host[len("http://"):]
            return host, False
        elif host.startswith("https://"):
            if host.endswith("/"):
                host = host[:-1]
            host = host[len("https://"):]
            return host, True
        else:
            raise CMQClientParameterException("Only support http(s) prototol. Invalid host:%s" % host)

    def build_req_inter(self, action, params, req_inter):
        _params = copy.deepcopy(params)
        _params['Action'] = action[0].upper() + action[1:]
        _params['RequestClient'] = self.version

        if (('SecretId' in _params) != True):
            _params['SecretId'] = self.secretId

        if (('Nonce' in _params) != True):
            _params['Nonce'] = random.randint(1, sys.maxsize)

        if (('Timestamp' in _params) != True):
            _params['Timestamp'] = int(time.time())
            
        if (('SignatureMethod' in _params) != True):
            if self.sign_method == 'sha256':
                _params['SignatureMethod'] = 'HmacSHA256'
            else:
                _params['SignatureMethod'] = 'HmacSHA1'
                
        sign = Sign(self.secretId, self.secretKey)
        _params['Signature'] = sign.make(self.host, req_inter.uri, _params, req_inter.method, self.sign_method)

        req_inter.data = urllib.parse.urlencode(_params)

        self.build_header(req_inter)

    def build_header(self, req_inter):
        if self.http.is_keep_alive():
            req_inter.header["Connection"] = "Keep-Alive"

    def check_status(self, resp_inter):
        if resp_inter.status != 200:
            raise CMQServerNetworkException(resp_inter.status, resp_inter.header, resp_inter.data)

        resp = json.loads(resp_inter.data)
        code, message, requestId = resp['code'], resp['message'], resp.get('requestId', '')

        if code != 0:
            raise CMQServerException(message=message, request_id=requestId, code=code, data=resp)

    def request(self, action, params):
        # make request internal
        UserTimeout = '0'
        req_inter = RequestInternal(self.method, URISEC)
        self.build_req_inter(action, params, req_inter)

        # send request
        if None != params.get('UserpollingWaitSeconds'):
            UserTimeout = params.get('UserpollingWaitSeconds')
        resp_inter = self.http.send_request(req_inter, UserTimeout)

        # handle result, make response
        # self.check_status(resp_inter)

        return resp_inter

#===============================================queue operation===============================================#

    def create_queue(self, params):
        resp_inter = self.request('CreateQueue', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("CreateQueue RequestId:%s QueueName:%s QueueId:%s" % \
                (ret['requestId'], params['queueName'], ret['queueId']))

    def delete_queue(self, params):
        resp_inter = self.request('DeleteQueue', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("DeleteQueue RequestId:%s QueueName:%s" % \
                (ret['requestId'], params['queueName']))

    def list_queue(self, params):
        resp_inter = self.request('ListQueue', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("ListQueue RequestId:%s QueueTotalCount:%d" % (ret['requestId'], ret['totalCount']))
        return ret

    def rewindQueue(self, params):
        resp_inter = self.request('RewindQueue', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("RewindQueue RequestId:%s QueueName:%s" % \
                (ret['requestId'], params['queueName']))


    def set_queue_attributes(self, params):
        resp_inter = self.request('SetQueueAttributes', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("SetQueueAttributes RequestId:%s QueueName:%s" % \
                (ret['requestId'], params['queueName']))


    def get_queue_attributes(self, params):
        resp_inter = self.request('GetQueueAttributes', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("GetQueueAttributes RequestId:%s QueueName:%s" % \
                (ret['requestId'], params['queueName']))
        return ret

    def send_message(self, params):
        resp_inter = self.request('SendMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("SendMessage RequestId:%s QueueName:%s MsgId:%s" % \
                (ret['requestId'], params['queueName'], ret['msgId']))
        return ret['msgId']

    def batch_send_message(self, params):
        resp_inter = self.request('BatchSendMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("BatchSendMessage RequestId:%s QueueName:%s MessageCount:%s MessageInfo\n%s" % \
                (ret['requestId'], params['queueName'], len(ret['msgList']), \
                 "\n".join(["MessageId:%s" % (msg['msgId']) for msg in ret['msgList']])))
        return ret['msgList']

    def receive_message(self, params):
        resp_inter = self.request('ReceiveMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("ReceiveMessage RequestId:%s QueueName:%s PollingWaitSeconds:%s MsgId:%s ReceiptHandle:%s \
            EnqueueTime:%s NextVisibleTime:%s FirstDequeueTime:%s DequeueCount:%s" % \
                (ret['requestId'], params['queueName'], params.get('pollingWaitSeconds', ''), ret['msgId'], ret['receiptHandle'],
                 ret['enqueueTime'], ret['nextVisibleTime'], ret['firstDequeueTime'], ret['dequeueCount']))
        return ret

    def batch_receive_message(self, params):
        resp_inter = self.request('BatchReceiveMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("BatchReceiveMessage RequestId:%s QueueName:%s PollingWaitSeconds:%s BatchSize:%s MessageCount:%s MessageInfo\n%s" % \
                (ret['requestId'], params['queueName'], params.get('pollingWaitSeconds', ''), params['numOfMsg'], len(ret['msgInfoList']), \
                 "\n".join(["MessageId:%s ReceiptHandle:%s EnqueueTime:%s NextVisibleTime:%s FirstDequeueTime:%s DequeueCount:%s" % \
                            (msg['msgId'], msg['receiptHandle'], msg['enqueueTime'], msg['nextVisibleTime'], msg['firstDequeueTime'], msg['dequeueCount']) for msg in ret['msgInfoList']])))
        return ret['msgInfoList']

    def delete_message(self, params):
        resp_inter = self.request('DeleteMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("DeleteMessage RequestId:%s QueueName:%s ReceiptHandle:%s" % \
                (ret['requestId'], params['queueName'], params['receiptHandle']))


    def batch_delete_message(self, params):
        resp_inter = self.request('BatchDeleteMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("BatchDeleteMessage RequestId:%s QueueName:%s ReceiptHandles\n%s" % \
                (ret['requestId'], params['queueName'], "\n".join([str(params[key]) for key in list(params.keys()) if 'receiptHandle.' in key])))

#=======================================================topic operation====================================#
    def create_topic(self, params):
        resp_inter = self.request('CreateTopic', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("CreateTopic RequestId:%s TopicName:%s TopicId:%s" % \
                (ret['requestId'], params['topicName'], ret['topicId']))

    def delete_topic(self, params):
        resp_inter = self.request('DeleteTopic', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("DeleteTopic RequestId:%s TopicName:%s" % \
                (ret['requestId'], params['topicName']))

    def list_topic(self, params):
        resp_inter = self.request('ListTopic', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("ListTopic RequestId:%s TopicTotalCount:%d" % (ret['requestId'], ret['totalCount']))
        return ret


    def set_topic_attributes(self, params):
        resp_inter = self.request('SetTopicAttributes', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("SetTopicAttributes RequestId:%s TopicName:%s" % \
                (ret['requestId'], params['topicName']))


    def get_topic_attributes(self, params):
        resp_inter = self.request('GetTopicAttributes', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("GetTopicAttributes RequestId:%s TopicName:%s" % \
                (ret['requestId'], params['topicName']))
        return ret  

    def publish_message(self, params):
        resp_inter = self.request('PublishMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("PublishMessage RequestId:%s TopicName:%s MsgId:%s" % \
                (ret['requestId'], params['topicName'], ret['msgId']))
        return ret['msgId']

    def batch_publish_message(self, params):
        resp_inter = self.request('BatchPublishMessage', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("BatchPublishMessage RequestId:%s TopicName:%s MessageCount:%s MessageInfo\n%s" % \
                (ret['requestId'], params['topicName'], len(ret['msgList']), \
                 "\n".join(["MessageId:%s" % (msg['msgId']) for msg in ret['msgList']])))
        return ret['msgList']  
#========================================Subscription operation===========================================#
    def create_subscription(self, params):
        resp_inter = self.request('Subscribe', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("Create subscription RequestId:%s subscription Name:%s subscripton Id:%s" % \
                (ret['requestId'], params['subscriptionName'], ret['subscriptionId']))

    def delete_subscription(self, params):
        resp_inter = self.request('Unsubscribe', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("DeleteTopic RequestId:%s TopicName:%s" % \
                (ret['requestId'], params['topicName']))

    def clear_filterTags(self, params):
        resp_inter = self.request('ClearSubscriptionFilterTags', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("ClearSubscriptionFilterTags RequestId:%s TopicName:%s" % \
                (ret['requestId'], params['topicName']))


    def list_subscription(self, params):
        resp_inter = self.request('ListSubscriptionByTopic', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("ListTopic RequestId:%s TopicTotalCount:%d" % (ret['requestId'], ret['totalCount']))
        return ret


    def set_subscription_attributes(self, params):
        resp_inter = self.request('SetSubscriptionAttributes', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("Set subscription Attributes RequestId:%s TopicName:%s" % \
                (ret['requestId'] if 'requestId' in ret else '', params['topicName'] if 'topicName' in ret else '' ))


    def get_subscription_attributes(self, params):
        resp_inter = self.request('GetSubscriptionAttributes', params)
        self.check_status(resp_inter)

        ret = json.loads(resp_inter.data)
        if self.logger:
            self.logger.debug("GetTopicAttributes RequestId:%s TopicName:%s" % \
                (ret['requestId'], params['topicName']))
        return ret  



