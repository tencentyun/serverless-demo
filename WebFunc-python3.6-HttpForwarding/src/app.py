import json
from http.server import BaseHTTPRequestHandler, HTTPServer
import logging
import hashlib
import os
import sys
from sys import argv

#设置的密钥
token = "test"

class Handler(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):#处理get请求
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))#打印get请求
        if str(self.path) == "/":#判断URL的路径
            a = self.checkSignature(token)
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(bytes(a,encoding = "utf8"))#返回验证参数

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])  # <--- Gets the size of data
        post_data = self.rfile.read(content_length)  # <--- Gets the data itself
        
        if self.path == "/":#判断URL路径
            #处理数据
            self.explorerHandle(post_data)
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(bytes("ok",encoding = "utf8"))#返回验证参数
            return
        data = json.dumps({'code': 404, 'status': 'not found'})
        self.send_response(404)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(data.encode('utf-8'))

    def explorerHandle(self, body):#处理数据函数
        logging.info("POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n",
                    str(self.path), str(self.headers), body.decode('utf-8'))#打印post请求

    def checkSignature(self,token):#模拟控制台加密算法生成数字签名与请求中的签名相对比
        signature = self.headers.get_all("signature")[0]
        Echostr = self.headers.get_all("Echostr")
        s = []
        s.append(token)
        s.append(self.headers.get_all("timestamp")[0])
        s.append(self.headers.get_all("nonce")[0])
        s.sort()
        tmpArr = s[0] + s[1] + s[2]
        #字符串排序加密
        sha1 = hashlib.sha1()
        sha1.update(tmpArr.encode('utf-8'))
        res = sha1.hexdigest()
        
        if res == signature:
            return Echostr[0]
        self.send_response(401)


def main_handler(server_class=HTTPServer, handler_class=Handler, port=9000):
    logging.basicConfig(level=logging.INFO)
    server_address = ('0.0.0.0', port)
    httpd = server_class(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
   main_handler()
