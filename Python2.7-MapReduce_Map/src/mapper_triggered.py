# -*- coding: utf8 -*-
from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
import re
import os
import logging
import sys

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

# domapping
def do_mapping(cos_client, bucket, key, middle_stage_bucket, middle_file_key):
    src_file_path = u'/tmp/' + key.split('/')[-1]
    middle_file_path = u'/tmp/' + u'mapped_' + key.split('/')[-1]
    download_ret = download_file(cos_client, bucket, key, src_file_path)  #download src file
    if download_ret == 0:
        inputfile = open(src_file_path, 'r')  #open local /tmp file
        mapfile = open(middle_file_path, 'w') #open a new file write stream
        for line in inputfile:
            line = re.sub('[^a-zA-Z0-9]', ' ', line) #replace non-alphabetic/number characters
            words = line.split() 
            for word in words:
                mapfile.write('%s\t%s' % (word, 1)) #count for 1
                mapfile.write('\n') 
        inputfile.close()
        mapfile.close()
        upload_ret = upload_file(cos_client, middle_stage_bucket, middle_file_key, middle_file_path) #upload the file's each word
        delete_file_folder(src_file_path)
        delete_file_folder(middle_file_path)
        return upload_ret
    else:
        return -1