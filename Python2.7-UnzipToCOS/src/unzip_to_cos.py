# -*- coding: utf-8 -*-
import json
import uuid
import os
import sys
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
# from unrar import rarfile
import shutil
import zipfile

reload(sys)
sys.setdefaultencoding('utf8')

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

appid = xxx  #  Please replace with your APPID. 请替换为您的 APPID
secret_id = u'**************'  # Please replace with your SecretId. 请替换为您的 SecretId
secret_key = u'************'  # Please replace with your SecretKey. 请替换为您的 SecretKey
region = u'ap-shanghai'
token = ''
bucket_upload = 'unrar-download-1256608914'  # Please replace with the bucket name which will be used after uncompressing. 请替换为解压后需要上传的bucket名
password = '12345'  # Please replace the decompression password of the compressed package. 请替换为压缩包的解压密码

config = CosConfig(Secret_id=secret_id, Secret_key=secret_key, Region=region, Token=token)
client = CosS3Client(config)
logger = logging.getLogger()

def delete_local_file(src):
    logger.info("delete files and folders")
    if os.path.isfile(src):
        try:
            os.remove(src)
        except:
            pass
    elif os.path.isdir(src):
        for item in os.listdir(src):
            itemsrc = os.path.join(src, item)
            delete_local_file(itemsrc)
        try:
            os.rmdir(src)
        except:
            pass


def upload_loacal_file(src, zipname):
    logger.info("Start to upload")
    for filename in os.listdir(src):
        path = src + '/{}'.format(os.path.basename(filename))
        logger.info("path is [%s]" % path)
        if os.path.isfile(path):
            logger.info("filename is [%s]" % filename)
            response = client.put_object_from_local_file(
                Bucket=bucket_upload,
                LocalFilePath=path,
                Key='{}/{}'.format(zipname, filename))
            delete_local_file(str(path))
        elif os.path.isdir(path):
            logger.info("dirname is [%s]" % filename)
            dirpath = zipname + '/{}'.format(filename)
            upload_loacal_file(path, dirpath)
        else:
            logger.info("Upload fail")


def listzipfilesinfo(path, toPath):
    with zipfile.ZipFile(path) as zipTools:
        zipTools.setpassword(password)
        logger.info("ZIP is [%s],toPath is [%s]" % (path, toPath))
        name_list = [unicode(item, 'cp936') for item in zipTools.namelist()]
        logger.info("name_list is [%s]" % (name_list))
        for index, value in enumerate(zipTools.namelist()):
            path = os.path.join(toPath, name_list[index])
            path = path.encode("utf8")
            logger.info("newpath is [%s]" % (path))
            data = zipTools.read(value)
            isdir = path[-1]
            if isdir != '/':
                with open(path, "w") as f:
                    f.write(data)
                    logger.info("write file [%s] success" % name_list[index])
            elif isdir == '/':
                os.mkdir(path)
                logger.info("mkdir [%s] success" % name_list[index])
            else:
                logger.info("path:[%s] write fail" % path)


def main_handler(event, context):
    logger.info("start main handler")
    for record in event['Records']:
        try:
            bucket = record['cos']['cosBucket']['name'] + '-' + str(appid)
            key = record['cos']['cosObject']['key']
            key = key.replace('/' + str(appid) + '/' + record['cos']['cosBucket']['name'] + '/', '', 1)
            download_path = '/tmp/{}'.format(key.encode('gb18030'))
            # Creating local path for uncompressing. 创建本地解压路径
            isExists = os.path.exists('/tmp/unzip')
            if not isExists:
                os.mkdir('/tmp/unzip')
            unzip_path = '/tmp/unzip'
            # Extracing file name. 提取文件名 shotname
            (filepath, tempfilename) = os.path.split(key);
            (shotname, extension) = os.path.splitext(tempfilename);
            logger.info("Object name is [%s]" % shotname)

            # download rar from cos
            logger.info("Get from [%s] to download object [%s]" % (bucket, key))
            try:
                response = client.get_object(Bucket=bucket, Key=key, )
                response['Body'].get_stream_to_file(download_path)
                logger.info("Download object [%s] Success" % key)
            except CosServiceError as e:
                print(e.get_error_code())
                print(e.get_error_msg())
                print(e.get_resource_location())
                logger.info("Download object [%s] failed" % key)
                return "Download object fail"

            # start to extract rar and upload to bucket_upload
            # logger.info("Start to extract rar")
            # rf = rarfile.RarFile(download_path)
            # rf.extractall(path=unrar_path, members=None, pwd=password)
            # upload_loacal_file('/tmp/unzip',shotname)

            # start to extract zip and upload to bucket_upload
            logger.info("Start to extract zip")
            zip_file = zipfile.is_zipfile(download_path)
            if zip_file:
                zf = zipfile.ZipFile(download_path, 'r')
                zf.setpassword(password)
                # zf.extractall(unzip_path,None,password)
                # logger.info("namelist [%s]" % zf.namelist())
                listzipfilesinfo(download_path, unzip_path)
                logger.info("Extract success")
                upload_loacal_file('/tmp/unzip', shotname)
            else:
                delete_local_file(str(download_path))
                return "Extract fail.This is not a zip file"

            delete_local_file(str(download_path))
            delete_local_file(str(unzip_path))

            return "Extract and upload success"

        except Exception as e:
            print(e)
            raise e
            return "Extract and upload fail"

