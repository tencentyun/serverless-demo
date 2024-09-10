# -*- coding: utf8 -*-
import hashlib, hmac, json, os, sys, time, base64
from datetime import datetime, timedelta
if sys.version_info[0] <= 2:
    from httplib import HTTPSConnection
else:
    from http.client import HTTPSConnection


# 计算签名摘要函数
def sign(key, msg):
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

# 计算签名信息
def authen_content(timestamp, date, secret_id, secret_key, payload, service, host, algorithm, action, params):
	
	# ************* 步骤 1：拼接规范请求串 *************
	http_request_method = "POST"
	canonical_uri = "/"
	canonical_querystring = ""
	ct = "application/json; charset=utf-8"
	canonical_headers = "content-type:%s\nhost:%s\nx-tc-action:%s\n" % (ct, host, action.lower())
	signed_headers = "content-type;host;x-tc-action"
	hashed_request_payload = hashlib.sha256(payload.encode("utf-8")).hexdigest()
	canonical_request = (http_request_method + "\n" +
	                     canonical_uri + "\n" +
	                     canonical_querystring + "\n" +
	                     canonical_headers + "\n" +
	                     signed_headers + "\n" +
	                     hashed_request_payload)

	# ************* 步骤 2：拼接待签名字符串 *************
	credential_scope = date + "/" + service + "/" + "tc3_request"
	hashed_canonical_request = hashlib.sha256(canonical_request.encode("utf-8")).hexdigest()
	string_to_sign = (algorithm + "\n" +
	                  str(timestamp) + "\n" +
	                  credential_scope + "\n" +
	                  hashed_canonical_request)

	# ************* 步骤 3：计算签名 *************
	secret_date = sign(("TC3" + secret_key).encode("utf-8"), date)
	secret_service = sign(secret_date, service)
	secret_signing = sign(secret_service, "tc3_request")
	signature = hmac.new(secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

	# ************* 步骤 4：拼接 Authorization *************
	authorization = (algorithm + " " +
	                 "Credential=" + secret_id + "/" + credential_scope + ", " +
	                 "SignedHeaders=" + signed_headers + ", " +
	                 "Signature=" + signature)
	return(authorization)

# 获取服务器状态
def get_cvm_status(timestamp, date, secretid, secretkey, region, insid):
	token = ""
	service = "cvm"
	host = "%s.tencentcloudapi.com" % service
	region = "%s" % region
	action = "DescribeInstances"
	version = "2017-03-12"
	payload = "{\"InstanceIds\":[\"%s\"]}" % insid
	params = json.loads(payload)
	endpoint = "https://cvm.tencentcloudapi.com"
	algorithm = "TC3-HMAC-SHA256"

	authorization = authen_content(timestamp, date, secretid, secretkey, payload, service, host, algorithm, action, params)

	headers = {
	    "Authorization": authorization,
	    "Content-Type": "application/json; charset=utf-8",
	    "Host": host,
	    "X-TC-Action": action,
	    "X-TC-Timestamp": timestamp,
	    "X-TC-Version": version
	}
	if region:
	    headers["X-TC-Region"] = region
	if token:
	    headers["X-TC-Token"] = token

	try:
	    req = HTTPSConnection(host)
	    req.request("POST", "/", headers=headers, body=payload.encode("utf-8"))
	    resp = req.getresponse()
	    return(resp.read())
	except Exception as err:
	    print(err)

# 执行服务器命令
def run_tat_command(timestamp, date, secretid, secretkey, region, insid, work_directory, user, run_content):
	token = ""
	service = "tat"
	host = "%s.tencentcloudapi.com" % service
	endpoint = "https://" + host
	region = "%s" % region
	action = "RunCommand"
	version = "2020-10-28"
	payload = "{\"CommandName\":\"cmd-test\",\"CommandType\":\"SHELL\",\"InstanceIds\":[\"%s\"],\"WorkingDirectory\":\"%s\",\"Username\":\"%s\",\"Content\":\"%s\"}" %(insid, work_directory, user, run_content)
	params = json.loads(payload)
	algorithm = "TC3-HMAC-SHA256"

	authorization = authen_content(timestamp, date, secretid, secretkey, payload, service, host, algorithm, action, params)

	headers = {
	    "Authorization": authorization,
	    "Content-Type": "application/json; charset=utf-8",
	    "Host": host,
	    "X-TC-Action": action,
	    "X-TC-Timestamp": timestamp,
	    "X-TC-Version": version
	}
	if region:
	    headers["X-TC-Region"] = region
	if token:
	    headers["X-TC-Token"] = token

	try:
	    req = HTTPSConnection(host)
	    req.request("POST", "/", headers=headers, body=payload.encode("utf-8"))
	    resp = req.getresponse()
	    return(resp.read())
	except Exception as err:
	    print(err)


def main_handler(event, context):
	timestamp = int(time.time())
	date = datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%d")
	secretid = os.environ.get('secretID')
	secretkey = os.environ.get('secretKey')

	# 实例信息获取
	insid = event['subject'].strip()
	region = event['region'].strip()
	

	# 命令执行参数
	work_directory = os.environ.get('work_Directory')
	user = os.environ.get('work_User')
	run_command = os.environ.get('run_Command')
	run_command_base = base64.b64encode(run_command.encode('utf-8'))

	# 判断服务器是否在 RUNNING 状态
	status_get = get_cvm_status(timestamp, date, secretid, secretkey, region, insid)
	status = json.loads(status_get)["Response"]["InstanceSet"][0]["InstanceState"]
	print(status)

	loop = 1
	while loop <= 6:
		if status == 'RUNNING':
			# 服务器命令执行
			time.sleep(10)
			tat_command = run_tat_command(timestamp, date, secretid, secretkey, region, insid, work_directory, user, run_command_base.decode('utf-8'))
			print(insid, tat_command, "故障自愈成功！")
			return("%s 故障自愈成功！" % insid)
			break;
		else:
			time.sleep(10)
			loop += 1
	else:
		print("机器状态未就绪！")
		return("机器状态未就绪！")

