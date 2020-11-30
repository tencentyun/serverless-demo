#coding=utf-8
import os
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
import sys
import logging
import time
import pymysql.cursors

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
BACKUP_BUCKET = os.getenv('cosbucket') #"dbbackup-1253970226"

BACKUP_PATH = '/tmp' # can only fill in the / tmp directory, because the cloud function operating environment only has the / tmp directory for reading and writing.
                     # 仅能填写 /tmp 目录，因为云函数运行环境仅有 /tmp 目录可读写。

def backup2cos(client,filepath, bucket, key):
    res_cos = client.put_object_from_local_file(
        Bucket=bucket,
        LocalFilePath=filepath,
        Key='{}'.format(key))
    print(res_cos)
    return res_cos
  
def main_handler(event, context):
    secret_id = os.environ.get('TENCENTCLOUD_SECRETID')      # Using the secterId in environment variables. 使用环境变量中的 secretId
    secret_key = os.environ.get('TENCENTCLOUD_SECRETKEY')    # Using the secretKey in environment variables. 使用环境变量中的 secretKey
    token = os.environ.get('TENCENTCLOUD_SESSIONTOKEN') 
    config = CosConfig(Region=REGION, SecretId=secret_id, SecretKey=secret_key, Token=token,)
    cos_client = CosS3Client(config)

    connection = pymysql.connect(host=DB_HOST,
                                     user=DB_USER,
                                     password=DB_USER_PASSWORD,
                                     port=int(DB_PORT),
                                     db=DB_NAME,
                                     charset='utf8',
                                     cursorclass=pymysql.cursors.DictCursor)
    with connection.cursor() as cursor:
        sql = 'show databases'
        cursor.execute(sql)
        res = cursor.fetchall()
        print res

    timestr = time.strftime('%Y%m%d-%H%M%S', time.localtime(time.time()))
    filename = DB_NAME+"-"+timestr+".sql"
    filepath = BACKUP_PATH+os.sep+filename
    print ("Start Backup")
    dumpcmd = "./mysqldump -h" + DB_HOST + " -P" + DB_PORT + " -u" + DB_USER + " -p" + DB_USER_PASSWORD + " " + DB_NAME + " > " + filepath
    print (dumpcmd)
    print os.popen(dumpcmd).read()
    print ("Backup script completed")
    print ("Your backups has been created in '" + filepath + "' file")
    print (os.popen('ls -l /tmp').read())
    print ("finish backup")
    print ("start send to cos")
    backup2cos(cos_client,filepath,BACKUP_BUCKET,"/"+filename)
    print ("finish send to cos")

if __name__ == "__main__":
    main_handler("","")
