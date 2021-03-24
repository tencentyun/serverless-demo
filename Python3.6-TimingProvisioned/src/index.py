import json
import os
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile
from tencentcloud.common.exception.tencent_cloud_sdk_exception import TencentCloudSDKException
from tencentcloud.scf.v20180416 import scf_client, models

def main_handler(event, context):
    try: 
        provision_params = json.loads(event['Message'])
        if len(provision_params) < 4:
            return ("Missing parameters")
        cred = credential.Credential(os.environ.get('TENCENTCLOUD_SECRETID'), os.environ.get('TENCENTCLOUD_SECRETKEY'), os.environ.get('TENCENTCLOUD_SESSIONTOKEN')) 
        httpProfile = HttpProfile()
        httpProfile.endpoint = "scf.tencentcloudapi.com"

        clientProfile = ClientProfile()
        clientProfile.httpProfile = httpProfile
        client = scf_client.ScfClient(cred, provision_params["Region"], clientProfile) 

        req = models.PutProvisionedConcurrencyConfigRequest()
        params = {
            "FunctionName": provision_params.get("FunctionName"),
            "Namespace": provision_params.get("Namespace"),
            "Qualifier": provision_params.get("Qualifier"),
            "VersionProvisionedConcurrencyNum": provision_params.get("VersionProvisionedConcurrencyNum")
        }
        req.from_json_string(json.dumps(params))

        resp = client.PutProvisionedConcurrencyConfig(req) 
        print(resp.to_json_string()) 

    except TencentCloudSDKException as err: 
        print(err) 
    return("Hello Serverless")