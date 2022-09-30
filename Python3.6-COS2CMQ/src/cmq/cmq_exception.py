#!/usr/bin/python
# -*- coding: utf-8 -*-

class CMQExceptionBase(Exception):
    """
    @type code: int
    @param code: 错误类型

    @type message: string
    @param message: 错误描述
    
    @type data: dict
    @param data: 错误数据
    """
    def __init__(self, message, code=-1, data={}):
        self.code = code
        self.message = message
        self.data = data

    def get_info(self):
        return 'Code:%s, Message:%s, Data:%s\n' % (self.code, self.message, self.data)

    def __str__(self):
        return "CMQExceptionBase  %s" % (self.get_info())

class CMQClientException(CMQExceptionBase):
    def __init__(self, message, code=-1, data={}):
        CMQExceptionBase.__init__(self, message, code, data)

    def __str__(self):
        return "CMQClientException  %s" % (self.get_info())
    
class CMQClientNetworkException(CMQClientException):
    """ 网络异常

        @note: 检查endpoint是否正确、本机网络是否正常等;
    """
    def __init__(self, message, code=-1, data={}):
        CMQClientException.__init__(self, message, code, data)

    def __str__(self):
        return "CMQClientNetworkException  %s" % (self.get_info())

class CMQClientParameterException(CMQClientException):
    """ 参数格式错误

        @note: 请根据提示修改对应参数;
    """
    def __init__(self, message, code=-1, data={}):
        CMQClientException.__init__(self, message, code, data)

    def __str__(self):
        return "CMQClientParameterException  %s" % (self.get_info())

class CMQServerNetworkException(CMQExceptionBase):
    """ 服务器网络异常
    """
    def __init__(self, status = 200, header = None, data = ""):
        if header == None:
            header = {}
        self.status = status
        self.header = header
        self.data = data

    def __str__(self):
        return "CMQServerNetworkException Status: %s\nHeader: %s\nData: %s\n" % \
            (self.status, "\n".join(["%s: %s" % (k,v) for k,v in list(self.header.items())]), self.data)

class CMQServerException(CMQExceptionBase):
    """ cmq处理异常

        @note: 根据code进行分类处理，常见错误类型：
             : 4000       参数不合法
             : 4100       鉴权失败:密钥不存在/失效
             : 4300       账户欠费了
             : 4400       消息大小超过队列属性设置的最大值
             : 4410       已达到队列最大的消息堆积数
             : 4420       qps限流
             : 4430       删除消息的句柄不合法或者过期了
             : 4440       队列不存在
             : 4450       队列个数超过限制
             : 4460       队列已经存在
             : 6000       服务器内部错误
             : 6010       批量删除消息失败（具体原因还要看每个消息删除失败的错误码）
             : 7000       空消息，即队列当前没有可用消息
             : 更多错误类型请登录腾讯云消息服务官网进行了解；
    """
    def __init__(self, message, request_id, code=-1, data={}):
        CMQExceptionBase.__init__(self, message, code, data)
        self.request_id = request_id

    def __str__(self):
        return "CMQServerException  %s\nRequestID:%s" % (self.get_info(), self.request_id)





