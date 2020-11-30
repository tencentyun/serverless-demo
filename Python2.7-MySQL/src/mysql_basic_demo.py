# -*- coding: utf8 -*-
import datetime
import pymysql.cursors
import logging
import sys
import pytz

# MySql database account information, you need to create a database in advance. MySql数据库账号信息,需要提前创建好数据库
Host = '******'
User = '****'
Password = '****'
Port = 63054
DB = u'SCF_Demo'

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

# Changing the time zone to Beijing. 更改时区为北京时区
tz = pytz.timezone('Asia/Shanghai')

g_connection = None
g_connection_errno = 0
def connect_mysql():
    global g_connection
    global g_connection_errno
    try:
        g_connection = pymysql.connect(host=Host,
                                     user=User,
                                     password=Password,
                                     port=Port,
                                     db=DB,
                                     charset='utf8',
                                     cursorclass=pymysql.cursors.DictCursor)
    except Exception as e:
        g_connection = None
        g_connection_errno = e[0]
        print("connect database error:%s"%e)

print("connect database")
connect_mysql()
def main_handler(event, context):
    print('Start function')
    print("{%s}" % datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"))
    print("g_connection is %s" % g_connection)
    if not g_connection:
        connect_mysql()
        if not g_connection:
            return {"code": 409, "errorMsg": "internal error %s" % g_connection_errno}

    with g_connection.cursor() as cursor:
        sql = 'show databases'
        cursor.execute(sql)
        res = cursor.fetchall()
        print res

        sql = 'use %s'%DB
        cursor.execute(sql)

        # Creating a data table. 创建数据表
        cursor.execute("DROP TABLE IF EXISTS Test")
        cursor.execute("CREATE TABLE Test (Msg TEXT NOT NULL,Time Datetime)")

        time = datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
        sql = "insert INTO Test (`Msg`, `Time`) VALUES (%s, %s)"
        cursor.execute(sql, ("test", time))
        g_connection.commit()

        sql = "select count(*) from Test"
        cursor.execute(sql)
        result = cursor.fetchall()
        print(result)
        cursor.close()


    print("{%s}" % datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"))

    return "test"