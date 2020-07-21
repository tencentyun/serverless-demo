# -*- coding: utf8 -*-
import logging
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
import os
import sys
from operator import itemgetter

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

#delete folders and files
def delete_file_folder(src):
    if os.path.isfile(src):
        try:  
            os.remove(src)  
        except:  
            pass 
    elif os.path.isdir(src):  
        for item in os.listdir(src):  
            itemsrc=os.path.join(src,item)  
            delete_file_folder(itemsrc)  
        try:  
            os.rmdir(src)  
        except:  
            pass

# Download files
def download_file(cos_client, bucket, key,download_path):
    logger.info("Get from [%s] to download file [%s]" % (bucket, key))
    try:
        response = cos_client.get_object(Bucket=bucket, Key=key, )
        response['Body'].get_stream_to_file(download_path)
    except CosServiceError as e:
        print(e.get_error_code())
        print(e.get_error_msg())
        return -1
    return 0

#  Upload file to bucket
def upload_file(cos_client, bucket, key, local_file_path):
    logger.info("Start to upload file to cos")
    try:
        response = cos_client.put_object_from_local_file(
            Bucket=bucket,
            LocalFilePath=local_file_path,
            Key='{}'.format(key))
    except CosServiceError as e:
        print(e.get_error_code())
        print(e.get_error_msg())
        return -1
    logger.info("Upload data map file [%s] Success" % key)
    return 0

# doreducing
def qcloud_reducer(cos_client, bucket, key, result_bucket, result_key):
    word2count = {}
    src_file_path = u'/tmp/' + key.split('/')[-1]
    result_file_path = u'/tmp/' + u'result_' + key.split('/')[-1]
    download_ret = download_file(cos_client, bucket, key, src_file_path)
    if download_ret == 0:
        map_file = open(src_file_path,'r')
        result_file = open(result_file_path,'w')
        for line in map_file:
            line = line.strip()
            word, count = line.split('\t', 1)
            try:
                count = int(count)
                word2count[word] = word2count.get(word, 0) + count
            except ValueError:
                logger.error("error value: %s, current line: %s" % (ValueError, line))
                continue
        map_file.close()
        delete_file_folder(src_file_path)
    sorted_word2count = sorted(word2count.items(), key=itemgetter(1))[::-1]
    for wordcount in sorted_word2count:
        res = '%s\t%s' % (wordcount[0], wordcount[1])
        result_file.write(res)
        result_file.write('\n')
    result_file.close()
    upload_ret = upload_file(cos_client, result_bucket, result_key, result_file_path)
    delete_file_folder(result_file_path)
    return upload_ret