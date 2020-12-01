# -*- coding: utf-8 -*-


#####----------------------------------------------------------------#####
#####                                                                #####
#####   使用教程/readme:                                              #####
#####   https://cloud.tencent.com/document/product/583/47076         #####
#####                                                                #####
#####----------------------------------------------------------------#####

import os
import sys
import os.path
import zipfile
import patool
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError

reload(sys)
sys.setdefaultencoding('utf8')
os.environ['PATH'] = os.getenv("PATH")+":"+os.getcwd()

logging.basicConfig(level=logging.INFO, stream=sys.stdout)

region = os.getenv('targetRegion')
bucket_upload = os.getenv('targetBucket')
unpack_suffix=os.getenv('suffix')
target_dir=os.getenv('targetPrefix')

logger = logging.getLogger()

def run_extract(archive, outdir):
    """Extract files from archive(s)."""
    try:
        patool.extract_archive(archive, verbosity=False, interactive="--non-interactive", outdir=outdir)
    except PatoolError as msg:
        logger.Error("error extracting %s: %s" % (archive, msg))

class PatoolError(Exception):
    pass

def _fullpath(x):
    x = os.path.expandvars(x)
    x = os.path.expanduser(x)
    x = os.path.normpath(x)
    x = os.path.abspath(x)
    return x


class Archive(object):

    '''
    :param backend: ``auto``, ``patool`` or ``zipfile``
    :param filename: path to archive file
    '''

    def __init__(self, filename, backend='auto'):
        self.filename = _fullpath(filename)
        self.backend = backend

    def extractall_patool(self, directory):
        logger.debug('starting backend patool')
        try:
            run_extract(self.filename, directory)
        except PatoolError as msg:
            logger.info("error extracting %s: %s", self.filename, msg)

    def extractall_zipfile(self, directory):
        logger.debug('starting backend zipfile')
        zipfile.ZipFile(self.filename).extractall(directory)

    def extractall(self, directory, auto_create_dir=False):
        '''
        :param directory: directory to extract to
        :param auto_create_dir: auto create directory
        '''
        logger.debug('extracting %s into %s (backend=%s)', self.filename, directory, self.backend)
        is_zipfile = zipfile.is_zipfile(self.filename)
        directory = _fullpath(directory)
        if not os.path.exists(self.filename):
            raise ValueError(
                'archive file does not exist:' + str(self.filename))
        if not os.path.exists(directory):
            if auto_create_dir:
                os.makedirs(directory)
            else:
                raise ValueError('directory does not exist:' + str(directory))

        if self.backend == 'auto':
            if is_zipfile:
                self.extractall_zipfile(directory)
            else:
                self.extractall_patool(directory)

        if self.backend == 'zipfile':
            if not is_zipfile:
                raise ValueError('file is not zip file:' + str(self.filename))
            self.extractall_zipfile(directory)

        if self.backend == 'patool':
            self.extractall_patool(directory)

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
def upload_local_file(client, src, archivename):
    logger.info("start to upload")
    for filename in os.listdir(src):
        path = src + '/{}'.format(os.path.basename(filename))
        logger.info("path is [%s]", path)
        if os.path.isfile(path):
            logger.info("filename is [%s]", filename)
            response = client.put_object_from_local_file(
                Bucket=bucket_upload,
                LocalFilePath=path,
                Key='{}/{}'.format(archivename, filename))
            delete_local_file(str(path))
        elif os.path.isdir(path):
            logger.info("dirname is [%s]", filename)
            dirpath = archivename + '/{}'.format(filename)
            upload_local_file(client, path, dirpath)
        else:
            logger.info("upload fail")

def main_handler(event, context):
    logger.info("start unpack template function")
    secret_id = os.getenv('TENCENTCLOUD_SECRETID') 
    secret_key = os.getenv('TENCENTCLOUD_SECRETKEY')
    token = os.getenv('TENCENTCLOUD_SESSIONTOKEN')

    config = CosConfig(Secret_id=secret_id, Secret_key=secret_key, Region=region, Token=token)
    client = CosS3Client(config)

    for record in event['Records']:
        try:
            appid = record['cos']['cosBucket']['appid']
            bucket = record['cos']['cosBucket']['name'] + '-' + appid
            filename = os.path.basename(record['cos']['cosObject']['url'])
            download_path = '/tmp/{}'.format(filename.encode('gb18030'))
            key = record['cos']['cosObject']['key']
            key = key.replace('/' + appid + '/' + record['cos']['cosBucket']['name'] + '/', '', 1)
            # 创建本地解压路径
            isExists = os.path.exists('/tmp/unpack')
            if not isExists:
                os.mkdir('/tmp/unpack')
            unpack_path = '/tmp/unpack'
            # 提取文件名 shotname
            (filepath, tempfilename) = os.path.split(filename);
            (shotname, extension) = os.path.splitext(tempfilename);

            if extension[1:] not in unpack_suffix.split(','):
                logger.info("object suffix is [%s], expected: [%s]", extension, unpack_suffix)
                return "object suffix is [%s], expected: [%s]" % (extension, unpack_suffix)
            logger.info("object name is [%s]", shotname)

            # download rar from cos
            logger.info("get from [%s] to download object [%s]", bucket, filename)
            try:
                response = client.get_object(Bucket=bucket, Key=key, )
                response['Body'].get_stream_to_file(download_path)
                logger.info("download object [%s] Success", filename)
            except CosServiceError as e:
                print(e.get_error_code())
                print(e.get_error_msg())
                print(e.get_resource_location())
                logger.info("download object [%s] failed", filename)
                return "download object fail"

            # start to extract archive file and upload to bucket_upload
            logger.info("start to extract archive file")
            Archive(download_path).extractall(unpack_path, auto_create_dir=True)
            logger.info("extract success")
            upload_local_file(client, '/tmp/unpack', target_dir)

            # clean files
            delete_local_file(str(download_path))
            delete_local_file(str(unpack_path))

            return "extract and upload success"

        except Exception as e:
            print(e)
            raise e
            return "extract and upload fail"
