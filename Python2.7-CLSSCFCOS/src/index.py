#!/usr/bin/env python
# -*- coding: utf-8 -*-
import os
import logging
import datetime
import gzip
import json
import uuid
from StringIO import StringIO
import pytz
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client

COMPRESSTYPE_GZIP = 'gzip'
COMPRESSTYPE_GZIP_SUFFIX = '.gz'
COMPRESSTYPE_LZOP = 'lzop'
COMPRESSTYPE_LZOP_SUFFIX = '.lzo'
COMPRESSTYPE_SNAPPY = 'snappy'
COMPRESSTYPE_SNAPPY_SUFFIX = '.snappy'

logger = logging.getLogger()


# object_key_generater. 生成文件名
def object_key_generater(prefix, strftime, compress_type):
    time_zone = pytz.timezone('Asia/Shanghai')
    timestr = datetime.datetime.now(time_zone).strftime(strftime)
    random = str(uuid.uuid4())

    # 根据压缩类型得到文件后缀
    file_suffix = ''
    if compress_type == COMPRESSTYPE_GZIP:
        file_suffix = COMPRESSTYPE_GZIP_SUFFIX
    elif compress_type == COMPRESSTYPE_LZOP:
        file_suffix = COMPRESSTYPE_LZOP_SUFFIX
    elif compress_type == COMPRESSTYPE_SNAPPY:
        file_suffix = COMPRESSTYPE_SNAPPY_SUFFIX

    obj_path = ''
    if prefix is not None:
        obj_path = os.path.join(
            prefix,
            '{}_{}{}'.format(timestr, random, file_suffix)
            )
    else:
        obj_path = '{}_{}{}'.format(timestr, random, file_suffix)
    return obj_path


def delete_local_file(src):
    """Deleting local file. 删除本地文件"""

    logger.info("delete " + src)
    if os.path.isfile(src):
        try:
            os.remove(src)
        except OSError as ex:
            print(ex)
        
    elif os.path.isdir(src):
        for item in os.listdir(src):
            itemsrc = os.path.join(src, item)
            delete_local_file(itemsrc)
        try:
            # /tmp 目录不能删
            if src != '/tmp':
                os.rmdir(src)
        except OSError as ex:
            print(ex)


# Uploading file to COS. 上传文件到COS
def upload_loacal_file(client, bucket_upload, loacalpath, obj_path):
    logger.info("Start to upload")
    if os.path.isfile(loacalpath):
        logger.info("local_filename is [%s]", loacalpath)
        logger.info("cos_object_name is [%s]", obj_path)
        response = client.put_object_from_local_file(Bucket=bucket_upload,
                                                     LocalFilePath=loacalpath,
                                                     Key=obj_path)
        logger.info("upload result is [%s]", response)
        return True
    else:
        logger.info("not local file ")
        return False


def write_to_file(compress_type, local_path, data):
    if not compress_type:
        with open(local_path, "a") as f:
            f.write(data)
    elif compress_type == COMPRESSTYPE_GZIP:
        tmp_path = "/tmp/gziptmp"
        with open(tmp_path, "a") as f:
            f.write(data)
        bashcmd = './{} {}'.format('gzip', tmp_path)
        os.system(bashcmd)
        # gzip 会自动添加.gz后缀
        os.rename(tmp_path + COMPRESSTYPE_GZIP_SUFFIX, local_path)
    elif compress_type == COMPRESSTYPE_LZOP:
        tmp_path = "/tmp/lzoptmp"
        with open(tmp_path, "a") as f:
            f.write(data)
        bashcmd = './{} {} -o {}'.format('lzop', tmp_path, local_path)
        os.system(bashcmd)
    elif compress_type == COMPRESSTYPE_SNAPPY:
        tmp_path = "/tmp/snappytmp"
        with open(tmp_path, "a") as f:
            f.write(data)
        bashcmd = './{} -t snappy-java {}'.format('snzip', tmp_path)
        os.system(bashcmd)
        # snzip 会自动添加.snappy后缀
        os.rename(tmp_path + COMPRESSTYPE_SNAPPY_SUFFIX, local_path)


def main_handler(event, context):
    # logger.info("context is %s", context)
    local_path = '/tmp/clstocostmpfile'
    
    # 从环境变量中获取参数
    secret_id = os.getenv('TENCENTCLOUD_SECRETID')
    secret_key = os.getenv('TENCENTCLOUD_SECRETKEY')
    region = os.getenv('TENCENTCLOUD_REGION')
    token = os.getenv('TENCENTCLOUD_SESSIONTOKEN')
    bucket_upload = os.getenv('CLSTOCOSUPLOADOBJBUKET')
    obj_path_prefix = os.getenv('CLSTOCOSUPLOADOBJPREFIX')
    strftime = os.getenv('CLSTOCOSUPLOADOBJSTRFTIME')
    compress_type = os.getenv('CLSTOCOSUPLOADOBJCOMPRESS')

    # 上传路径bucket_upload/obj_path_prefix/strftime_uuid.compress_type
    obj_path = object_key_generater(obj_path_prefix, strftime, compress_type)
    logger.info("cos_object_name will be [%s]", obj_path)
    config = CosConfig(
        Region=region,
        Secret_id=secret_id,
        Secret_key=secret_key,
        Token=token
        )
    client = CosS3Client(config)
    event = json.loads(
        gzip.GzipFile(fileobj=StringIO(event['clslogs']['data'].decode(
            'base64'))).read())
    data = ''
    for record in event['records']:
        data = data + record['content'].replace('value2', "value2_replaced") + "\r\n"
    try:
        write_to_file(compress_type, local_path, data)
    except OSError as ex:
        logger.error("Error occured when writing %s", ex)
        # 清理临时目录
        delete_local_file('/tmp')
        raise ex

    # 上传处理后的日志文件
    result = "ok"
    if upload_loacal_file(
        client, bucket_upload,
        local_path, obj_path
        ) is False:
        result = "failed"

    # 清理临时目录
    delete_local_file('/tmp')
    return result
