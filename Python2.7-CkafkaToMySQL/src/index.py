#!/usr/bin/python
# -*- coding: UTF-8 -*-
import pymysql
import os
import logging
from os import getenv
from pymysql.err import OperationalError

# 从函数环境变量获取数据库信息
DB_HOST = os.getenv('dbhost')
DB_USER = os.getenv('dbuser')
DB_USER_PASSWORD = os.getenv('dbpwd')
DB_DATABASE = os.getenv('dbdatabase') 
DB_TABLE = os.getenv('dbtable')

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

mysql_conn = None

def __get_cursor():
    try:
        return mysql_conn.cursor()
    except OperationalError:
        mysql_conn.ping(reconnect=True)
        return mysql_conn.cursor()

def main_handler(event, context):
    # 使用 pymysql 无连接池功能链接数据库，避免循环插入时报错
    global mysql_conn
    if not mysql_conn:
        mysql_conn = pymysql.connect(DB_HOST, DB_USER, DB_USER_PASSWORD,DB_DATABASE,autocommit = True)
    sql =  "INSERT INTO `" + str(DB_TABLE)+ "` (`offset`, `msgBody`) VALUES (%s, %s)" # 插入offset，msgBody字段，可自定义
    with __get_cursor() as cursor:
        for record in event["Records"]:
            logger.info("msg: %s", record["Ckafka"]["msgBody"])
            logger.info("offset: %s", record["Ckafka"]["offset"])
            offset = record["Ckafka"]["offset"]
            msgBody = record["Ckafka"]["msgBody"]
            cursor.execute(sql, (offset, msgBody))
    return 'successful!' 
