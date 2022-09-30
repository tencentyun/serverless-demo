#!/usr/bin/python
# -*- coding: utf-8 -*-


import socket
from http.client import HTTPConnection, BadStatusLine, HTTPSConnection
from cmq.cmq_exception import CMQClientNetworkException

class CMQHTTPConnection(HTTPConnection):
    def __init__(self, host, port=None):
        HTTPConnection.__init__(self, host, port)
        self.request_length = 0

    def send(self, astr):
        HTTPConnection.send(self, astr)
        self.request_length += len(astr)

    def request(self, method, url, body=None, headers={}):
        self.request_length = 0
        HTTPConnection.request(self, method, url, body, headers)

class CMQHTTPSConnection(HTTPSConnection):
    def __init__(self, host, port=None):
        HTTPSConnection.__init__(self, host, port)
        self.request_length = 0

    def send(self, astr):
        HTTPSConnection.send(self, astr)
        self.request_length += len(astr)

    def request(self, method, url, body=None, headers={}):
        self.request_length = 0
        HTTPSConnection.request(self, method, url, body, headers)

class CMQHttp:
    def __init__(self, host, connection_timeout = 10, keep_alive = True, logger=None, is_https=False):
        if is_https:
            self.conn = CMQHTTPSConnection(host)
        else:
            self.conn = CMQHTTPConnection(host)
        self.connection_timeout = connection_timeout
        self.keep_alive = keep_alive
        self.request_size = 0
        self.response_size = 0
        self.logger = logger
        if self.logger:
            self.logger.debug("InitCMQHttp KeepAlive:%s ConnectionTime:%s" % (self.keep_alive, self.connection_timeout))

    def set_log_level(self, log_level):
        if self.logger:
            self.logger.setLevel(log_level)

    def close_log(self):
        self.logger = None

    def set_connection_timeout(self, connection_timeout):
        self.connection_timeout = connection_timeout

    def set_keep_alive(self, keep_alive):
        self.keep_alive = keep_alive

    def is_keep_alive(self):
        return self.keep_alive

    def send_request(self, req_inter,UserTimeOut):
        try:
            if self.logger:
                self.logger.debug("SendRequest %s" % req_inter)
            if req_inter.method == 'GET':
                req_inter_url = '%s?%s' % (req_inter.uri, req_inter.data)
                self.conn.request(req_inter.method, req_inter_url, None, req_inter.header)
            elif req_inter.method == 'POST':
                self.conn.request(req_inter.method, req_inter.uri, req_inter.data, req_inter.header)
            else:
                raise Exception('Method only support (GET, POST)')
            self.conn.sock.settimeout(self.connection_timeout+int(UserTimeOut))
            self.conn.sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            try:
                http_resp = self.conn.getresponse()
            except BadStatusLine:
                #open another connection when keep-alive timeout
                #httplib will not handle keep-alive timeout, so we must handle it ourself
                if self.logger:
                    self.logger.debug("keep-alive timeout, reopen connection")
                self.conn.close()

                #raise CMQClientNetworkException("Connection TImeout");
                self.conn.request(req_inter.method, req_inter.uri, req_inter.data, req_inter.header)
                self.conn.sock.settimeout(self.connection_timeout+int(UserTimeOut))
                self.conn.sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                http_resp = self.conn.getresponse()
            headers = dict(http_resp.getheaders())
            resp_inter = ResponseInternal(status = http_resp.status, header = headers, data = http_resp.read())
            self.request_size = self.conn.request_length
            self.response_size = len(resp_inter.data)
            if not self.is_keep_alive():
                self.conn.close()
            if self.logger:
                self.logger.debug("GetResponse %s" % resp_inter)
            return resp_inter
        except Exception as e:
            self.conn.close()
            raise CMQClientNetworkException(str(e))

class RequestInternal:
    def __init__(self, method = "", uri = "", header = None, data = ""):
        if header == None:
            header = {}
        self.method = method
        self.uri = uri
        self.header = header
        self.data = data

    def __str__(self):
        return "Method: %s\nUri: %s\nHeader: %s\nData: %s\n" % \
                (self.method, self.uri, "\n".join(["%s: %s" % (k,v) for k,v in list(self.header.items())]), self.data)

class ResponseInternal:
    def __init__(self, status = 0, header = None, data = ""):
        if header == None:
            header = {}
        self.status = status
        self.header = header
        self.data = data

    def __str__(self):
        return "Status: %s\nHeader: %s\nData: %s\n" % \
            (self.status, "\n".join(["%s: %s" % (k,v) for k,v in list(self.header.items())]), self.data)
