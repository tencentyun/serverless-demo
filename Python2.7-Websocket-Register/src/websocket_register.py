# -*- coding: utf8 -*-
import json
import requests
import datetime
import time
import pymysql.cursors
import logging
import sys
import pytz

print('Start Register function')

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

#Changing the time zone to Beijing. 更改时区为北京时区
tz = pytz.timezone('Asia/Shanghai')

def record_connectionID(connectionID):
    print('Start record_connectionID function')
    print("connectionID is %s " % connectionID)
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
            time = datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S")
            sql = "insert INTO %s" % Table + "(`ConnectionID`, `Date`) VALUES (%s, %s)"
            cursor.execute(sql, (str(connectionID), time))
            connection.commit()
            # sql = "select * from %s" % Table
            # cursor.execute(sql)
            # res = cursor.fetchall()
            # print res
    finally:
        connection.close()


def main_handler(event, context):
    print("event is %s" % event)
    if 'requestContext' not in event.keys():
        return {"errNo": 101, "errMsg": "not found request context"}
    if 'websocket' not in event.keys():
        return {"errNo": 102, "errMsg": "not found web socket"}

    connectionID = event['websocket']['secConnectionID']
    retmsg = {}
    retmsg['errNo'] = 0
    retmsg['errMsg'] = "ok"
    retmsg['websocket'] = {
        "action": "connecting",
        "secConnectionID": connectionID
    }

    if "secWebSocketProtocol" in event['websocket'].keys():
        retmsg['websocket']['secWebSocketProtocol'] = event['websocket']['secWebSocketProtocol']
    if "secWebSocketExtensions" in event['websocket'].keys():
        ext = event['websocket']['secWebSocketExtensions']
        retext = []
        exts = ext.split(";")
        print(exts)
        for e in exts:
            e = e.strip(" ")
            if e == "permessage-deflate":
                # retext.append(e)
                pass
            if e == "client_max_window_bits":
                # retext.append(e+"=15")
                pass
        retmsg['websocket']['secWebSocketExtensions'] = ";".join(retext)

    # Recording the new 'connectionID' in database. 在数据库中记录新的connectionID
    print("Start DB Request {%s}" %datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"))
    record_connectionID(connectionID)
    print("Finish DB Request {%s}" % datetime.datetime.now(tz).strftime("%Y-%m-%d %H:%M:%S"))

    print("connecting: connection id:%s" % event['websocket']['secConnectionID'])
    return retmsg
