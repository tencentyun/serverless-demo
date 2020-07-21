# -*- coding: utf8 -*-
import json
import requests
import datetime
import time
import pymysql.cursors
import logging
import sys
import pytz

print('Start Delete function')

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

# The reverse push link for API gateway. API网关的反向推送链接
sendbackHost = "*******"
# MySql database account information, you need to create a database and form in advance, the new two columns in the form: `ConnectionID`, `Date` 
# MySql数据库账号信息,需要提前创建好数据库和表单,表单中新建2列：`ConnectionID`, `Date`
Host = '******'
User = '****'
Password = '****'
Port = 63054
DB = u'SCF_Demo'
Table = u'ConnectionID_List'

# Changing the time zone to Beijing. 更改时区为北京时区
tz = pytz.timezone('Asia/Shanghai')

# Looking up and deleting the 'connectionID' in the database. 查询数据库中的connectionID并删除
def delete_connectionID(connectionID):
    print('Start delete_connectionID function')
    print("connectionID is %s"%connectionID)
    connection = pymysql.connect(host=Host,
                                 user=User,
                                 password=Password,
                                 port=Port,
                                 db=DB,
                                 charset='utf8',
                                 cursorclass=pymysql.cursors.DictCursor)
    try:
        with connection.cursor() as cursor:
            sql = "use %s" % DB
            cursor.execute(sql)
            sql = "delete from %s"%Table + " where ConnectionID = %s"
            cursor.execute(sql, (str(connectionID)))
            connection.commit()
    finally:
        connection.close()


# Sending disconnection information proactively. 主动发送断开信息
def close(connectionID):
    retmsg = {}
    retmsg['websocket'] = {}
    retmsg['websocket']['action'] = "closing"
    retmsg['websocket']['secConnectionID'] = connectionID
    r = requests.post(sendbackHost, json=retmsg)
    return retmsg


def main_handler(event, context):
    print("event is %s" % event)
    if 'websocket' not in event.keys():
        return {"errNo":102, "errMsg":"not found web socket"}
    else:
        print("Start DB Request {%s}" % datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"))
        delete_connectionID(event['websocket']['secConnectionID'])
        print("Finish DB Request {%s}" %datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"))
        # close(connectionID)
    return event

