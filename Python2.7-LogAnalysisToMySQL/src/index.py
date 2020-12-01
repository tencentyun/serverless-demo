# -*- coding: utf-8 -*-
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from datetime import datetime
from time import time
import re
import operator
import pymysql.cursors
import logging
import sys
import os

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

# Need to add the appropriate configuration in environment variables. 需要在环境变量中添加相应的配置
DB_HOST = os.getenv('dbhost') #'sh-cdb-irye027y.sql.tencentcdb.com'
DB_PORT = os.getenv('dbport') #'63374'
DB_USER = os.getenv('dbuser') #'root'
DB_USER_PASSWORD = os.getenv('dbpwd') #'abc123!@#'
DB_NAME = os.getenv('dbname') #'cAuth'
REGION = os.getenv('cosregion') #'ap-shanghai'

def main_handler(event, context):
    logger.info("start main handler")
    if "Records" not in event.keys():
        return {"errorMsg": "event is not come from cos"}
   
    print("Start Request {}", datetime.fromtimestamp(time()).strftime('%Y-%m-%d %H:%M:%S'))

    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      # Using the secterId in environment variables. 使用环境变量中的 secretId
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    # Using the secretKey in environment variables.使用环境变量中的 secretKey
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
    appid = event['Records'][0]['cos']['cosBucket']['appid']
    config = CosConfig(Region=REGION, SecretId=secret_id, SecretKey=secret_key, Token=token,)
    cos_client = CosS3Client(config)

    # Start downloading from COS
    bucket = event['Records'][0]['cos']['cosBucket']['name'] + '-' + str(appid)
    key = event['Records'][0]['cos']['cosObject']['key']
    key = key.replace('/' + str(appid) + '/' + event['Records'][0]['cos']['cosBucket']['name'] + '/', '', 1)
    download_path = '/tmp/{}'.format(key)
    print("Key is " + key)
    print("Get from [%s] to download file [%s]" % (bucket, key))
    try:
        response = cos_client.get_object(Bucket=bucket, Key=key, )
        response['Body'].get_stream_to_file(download_path)
    except CosServiceError as e:
        print(e.get_error_code())
        print(e.get_error_msg())
        print(e.get_resource_location())
        return "Download log fail"
    logger.info("Download file [%s] Success" % key)
        
    print("Start analyzing data {}", datetime.fromtimestamp(time()).strftime('%Y-%m-%d %H:%M:%S'))
    urlList = {}
    statuelist = {}
    terminalList = {}
    timeList = {"24/May/2018 10:00-10:30": 0, "24/May/2018 10:30-11:00": 0}

    fileObject = open(download_path, 'rU')
    try:
        for line in fileObject:
            # Count URL
            URLstart = re.search("GET", line)
            URLend = re.search("mp4", line)
            if URLstart and URLend:
                url = line[URLstart.end() + 1: URLend.end()]
                if url in urlList:
                    urlList[url] += 1
                else:
                    urlList[url] = 1

            # Count Statue code
            Statuestart = re.search("HTTP/1.1", line)
            if Statuestart:
                StatueCode = line[Statuestart.end() + 2: Statuestart.end() + 5]
                if StatueCode in statuelist:
                    statuelist[StatueCode] += 1
                else:
                    statuelist[StatueCode] = 1

            # Count Terminal Device
            Terminalstart = re.search("\"-\"", line)
            TerminalEnd = re.search("\"-\" \"-\"", line)
            if Terminalstart and TerminalEnd:
                terminal = line[Terminalstart.end() + 2: TerminalEnd.start() - 2]
                if terminal in terminalList:
                    terminalList[terminal] += 1
                else:
                    terminalList[terminal] = 1

            # Count Timelist
            Timestarter = re.search("\[", line)
            if Timestarter:
                if int(line[Timestarter.end() + 15: Timestarter.end() + 17]) > 30:
                    timeList["24/May/2018 10:30-11:00"] += 1
                else:
                    timeList["24/May/2018 10:00-10:30"] += 1
    finally:
        fileObject.close()

    # Sort Result according to frequence
    URL_sorted_res = sorted(urlList.items(), key=operator.itemgetter(1), reverse=True)
    Statue_sorted_res = sorted(statuelist.items(), key=operator.itemgetter(1), reverse=True)
    Terminal_sorted_res = sorted(terminalList.items(), key=operator.itemgetter(1), reverse=True)
    Time_sorted_res = sorted(timeList.items(), key=operator.itemgetter(1), reverse=True)

    URLres = []
    Statueres = []
    Terminalres = []
    Timeres = []

    for i in range(3):
        URLres.append(URL_sorted_res[i])
        Statueres.append(Statue_sorted_res[i])
        Terminalres.append(Terminal_sorted_res[i])

    for i in range(2):
        Timeres.append(Time_sorted_res[i])

    print("Analyzing Successfully, Start writing to database {}",
            datetime.fromtimestamp(time()).strftime('%Y-%m-%d %H:%M:%S'))

    connection = pymysql.connect(host=DB_HOST,
                                     user=DB_USER,
                                     password=DB_USER_PASSWORD,
                                     port=int(DB_PORT),
                                     db=DB_NAME,
                                     charset='utf8',
                                     cursorclass=pymysql.cursors.DictCursor)

    try:
        with connection.cursor() as cursor:
            # Clean dirty data
            cursor.execute("DROP TABLE IF EXISTS url")
            cursor.execute("DROP TABLE IF EXISTS state")
            cursor.execute("DROP TABLE IF EXISTS terminal")
            cursor.execute("DROP TABLE IF EXISTS time")
            cursor.execute("CREATE TABLE url (URL TEXT NOT NULL, Count INT)")
            cursor.execute("CREATE TABLE state (StateCode TEXT NOT NULL, Count INT)")
            cursor.execute("CREATE TABLE terminal (Terminal TEXT NOT NULL, Count INT)")
            cursor.execute("CREATE TABLE time (Timestatue TEXT NOT NULL, Count INT)")

            sql = "INSERT INTO `url` (`URL`, `Count`) VALUES (%s, %s)"
            for i in range(len(URLres)):
                cursor.execute(sql, (URLres[i][0], URLres[i][1]))

            sql = "INSERT INTO `state` (`StateCode`, `Count`) VALUES (%s, %s)"
            for i in range(len(Statueres)):
                cursor.execute(sql, (Statueres[i][0], Statueres[i][1]))

            sql = "INSERT INTO `terminal` (`Terminal`, `Count`) VALUES (%s, %s)"
            for i in range(len(Terminalres)):
                cursor.execute(sql, (Terminalres[i][0], Terminalres[i][1]))

            sql = "INSERT INTO `time` (`Timestatue`, `Count`) VALUES (%s, %s)"
            for i in range(len(Timeres)):
                cursor.execute(sql, (Timeres[i][0], Timeres[i][1]))

        connection.commit()

    finally:
        connection.close()

    print("Write to database successfully {}", datetime.fromtimestamp(time()).strftime('%Y-%m-%d %H:%M:%S'))
    return "LogAnalysis Success"