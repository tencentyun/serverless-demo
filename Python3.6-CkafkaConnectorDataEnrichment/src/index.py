#!/usr/bin/env python
# -*- coding: utf8 -*-


import base64
import json
import logging
import os
import re
import time

import pymysql


logger = logging.getLogger()
# Need to add the appropriate configuration in environment variables. 需要在环境变量中添加相应的配置
DB_HOST = os.getenv('dbhost') # 数据库 host
DB_PORT = os.getenv('dbport') # 数据库 port 
DB_USER = os.getenv('dbuser') # 数据库 username
DB_USER_PASSWORD = os.getenv('dbpwd') # 数据库密码
DB_NAME = os.getenv('dbname') # 数据库名称


class DBSource(object):
    """
    Mysql 数据库作为数据源
    """
    def __init__(self):
        try:
            self.conn = pymysql.connect(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                passwd=DB_USER_PASSWORD,
                db=DB_NAME,
                connect_timeout=5)
        except Exception as e:
            logger.error(e)
            logger.error("ERROR: Unexpected error: Could not connect to MySql instance.")
            raise Exception(str(e))

    def fetch(self, sql):
        """
        查询记录
        """
        with self.conn.cursor() as cursor:
            cursor.execute(sql)
            result = cursor.fetchall()
            return result

db_source = DBSource()


def main_handler(event, context):
    """
    CKafka Connector 传递过来的 event 结构如下：
    {
        "event": {
            "data": [
                msg1,
                msg2,
            ]
        }

    }
    在这里，测试数据结构为：
    {
        "event": {
            "data": [
                '{"name": "Anny", "age": 21, "phone": "13111111111"}',
                '{"name": "Ernest", "age": 22, "phone": "13111112222"}',
            ]
        }
    }
    其中，每一条数据都是 json string，包含的信息是用户的基础资料，分别是“姓名”、“年龄”、“手机号码”,
    通过数据库查询，例如用手机号作为查询条件，找到数据库中的记录，将数据库中存储的其他字段合并到这条数据中，例如用户的“住址”，完成数据富化操作。
    最后，每一条记录都增加一个字段，记录当前处理的时间。
    """
    print('start main_handler')
    num = len(event['event']['data'])
    print('the length of msg body is [%s]'%num)  
    messages = []  
    for message in event['event']['data']:
        # 将 json string 解析成字典 
        message = json.loads(message)
        table = '<替换成实际的数据表>'
        sql = 'SELECT * FROM %s WHERE phone = %s' % (table, message['phone'])
        db_record = db_source.fetch(sql)
        # 这里即可将 db_record 中的 address 字段添加到 message 中
        message['address'] = db_record[0]['address']
        message['time'] = time.time()
        messages.append(message)
    result = {
        'result': 'Succeed',
        'data': messages
    }
    # 如果处理失败，可封装错误消息体：
    # {"result": "Failed"}
    return result


if __name__ == '__main__':
    event = {
        "event": {
            "data": [
                '{"name": "Anny", "age": 21, "phone": "13111111111"}',
                '{"name": "Ernest", "age": 22, "phone": "13111112222"}',
            ]
        }
    }
    result = main_handler(event, {})
    print(result)
