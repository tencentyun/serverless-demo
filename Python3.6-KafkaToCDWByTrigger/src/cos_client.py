import os
import logging
import pytz
from datetime import datetime

from qcloud_cos_v5 import CosConfig
from qcloud_cos_v5 import CosS3Client
from qcloud_cos_v5 import CosServiceError
from qcloud_cos_v5 import CosClientError

logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

class COSClient(object):
    def __init__(self, region:str, secret_id:str, secret_key:str, bucket:str):
        config = CosConfig(Region=region, Secret_id=secret_id, Secret_key=secret_key)
        self.bucket = bucket
        self.client = CosS3Client(config)

    
    # Generating file name. 生成写入文件名
    def object_key_generater(self, request_id):
        tz = pytz.timezone('Asia/Shanghai')
        date_dir = datetime.now(tz).strftime("%Y%m%d%H")
        file_name = request_id + '.csv'
        object_key = '{}/{}/{}'.format(os.getenv('SCF_FUNCTIONNAME'),date_dir,file_name)
        return object_key


    def check_cos_file_exist(self, key):
        try:
            resp = self.client.head_object(
                Bucket=self.bucket,
                Key=key
            )
            return True
        except CosServiceError as e:
            if e.get_error_code()== "NoSuchResource":
                return False
            raise e

    def upload_buffer_file(self, sio, request_id):
        key = self.object_key_generater(request_id)
        logger.info("cos file key is [%s]" % key)

        try:
            if self.check_cos_file_exist(key) == True:
                logger.info("cos file [%s] already exist" % key)   
                return True

            response = self.client.upload_file_from_buffer(
                Bucket=self.bucket,
                Body=sio,
                Key=key)
        except CosServiceError as e:
            logger.info("e is [%s]"% e)
            return False        

        return True

