# -*- coding: utf8 -*-
import hashlib
import hmac
import json
import os
import sys
import time
import base64
from datetime import datetime

if sys.version_info[0] <= 2:
    from httplib import HTTPSConnection
else:
    from http.client import HTTPSConnection

# Constants
ALGORITHM = "TC3-HMAC-SHA256"
CONTENT_TYPE = "application/json; charset=utf-8"
API_DOMAIN = ".tencentcloudapi.com"
SIGNED_HEADERS = "content-type;host;x-tc-action"
MAX_RETRY_ATTEMPTS = 6
RETRY_DELAY = 10
STABILIZATION_DELAY = 20
CVM_API_VERSION = "2017-03-12"
TAT_API_VERSION = "2020-10-28"
RUNNING_STATE = "RUNNING"


def sign(key, msg):
    """计算签名摘要"""
    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()


def get_authorization(timestamp, date, secret_id, secret_key, payload, service, action):
    """生成腾讯云API认证信息"""
    host = f"{service}{API_DOMAIN}"
    
    # 步骤1: 拼接规范请求串
    canonical_headers = f"content-type:{CONTENT_TYPE}\nhost:{host}\nx-tc-action:{action.lower()}\n"
    hashed_payload = hashlib.sha256(payload.encode("utf-8")).hexdigest()
    
    canonical_request = "\n".join([
        "POST", "/", "", canonical_headers, SIGNED_HEADERS, hashed_payload
    ])
    
    # 步骤2: 拼接待签名字符串
    credential_scope = f"{date}/{service}/tc3_request"
    hashed_canonical_request = hashlib.sha256(canonical_request.encode("utf-8")).hexdigest()
    
    string_to_sign = "\n".join([
        ALGORITHM, str(timestamp), credential_scope, hashed_canonical_request
    ])
    
    # 步骤3: 计算签名
    secret_date = sign(f"TC3{secret_key}".encode("utf-8"), date)
    secret_service = sign(secret_date, service)
    secret_signing = sign(secret_service, "tc3_request")
    signature = hmac.new(secret_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()
    
    # 步骤4: 拼接Authorization
    return f"{ALGORITHM} Credential={secret_id}/{credential_scope}, SignedHeaders={SIGNED_HEADERS}, Signature={signature}"

def call_api(service, action, version, payload, timestamp, date, secret_id, secret_key, region=None):
    """通用腾讯云API调用函数"""
    host = f"{service}{API_DOMAIN}"
    headers = {
        "Authorization": get_authorization(timestamp, date, secret_id, secret_key, payload, service, action),
        "Content-Type": CONTENT_TYPE,
        "Host": host,
        "X-TC-Action": action,
        "X-TC-Timestamp": str(timestamp),
        "X-TC-Version": version
    }
    
    if region:
        headers["X-TC-Region"] = region
    
    conn = None
    try:
        conn = HTTPSConnection(host)
        conn.request("POST", "/", headers=headers, body=payload.encode("utf-8"))
        response = conn.getresponse()
        response_data = response.read()
        
        if isinstance(response_data, bytes):
            response_data = response_data.decode('utf-8')
            
        return response_data
    except Exception as err:
        print(f"API调用失败: {err}")
        raise
    finally:
        if conn:
            conn.close()


def get_cvm_status(timestamp, date, secret_id, secret_key, region, instance_id):
    """获取CVM实例状态"""
    payload = json.dumps({"InstanceIds": [instance_id]})
    return call_api("cvm", "DescribeInstances", CVM_API_VERSION, 
                   payload, timestamp, date, secret_id, secret_key, region)

def run_tat_command(timestamp, date, secret_id, secret_key, region, instance_id, 
                   work_directory, user, command_content):
    """执行TAT命令"""
    payload = json.dumps({
        "CommandName": "cmd-test",
        "CommandType": "SHELL",
        "InstanceIds": [instance_id],
        "WorkingDirectory": work_directory,
        "Username": user,
        "Content": command_content
    })
    return call_api("tat", "RunCommand", TAT_API_VERSION, 
                   payload, timestamp, date, secret_id, secret_key, region)
    
def query_tat_command(timestamp, date, secret_id, secret_key, region, invocation_id):
    """查询TAT执行结果。使用Filters参数精确查询指定的调用ID"""
    payload = json.dumps({
        "Filters": [
            {
                "Name": "invocation-id",
                "Values": [invocation_id]
            }
        ]
    })
    return call_api("tat", "DescribeInvocationTasks", TAT_API_VERSION, 
                   payload, timestamp, date, secret_id, secret_key, region)


def validate_environment_variables():
    """验证必需的环境变量"""
    required_vars = ['secretID', 'secretKey', 'work_Directory', 'work_User', 'run_Command']
    env_vars = {var: os.environ.get(var) for var in required_vars}
    missing_vars = [var for var, value in env_vars.items() if not value]
    
    if missing_vars:
        error_msg = f"缺少必需的环境变量: {', '.join(missing_vars)}"
        print(error_msg)
        return None, error_msg
    
    return env_vars, None

def safe_json_loads(response_text):
    """安全的JSON解析，包含错误检查"""
    try:
        data = json.loads(response_text)
        if "Error" in data.get("Response", {}):
            error_info = data["Response"]["Error"]
            raise Exception(f"API错误: {error_info.get('Code')} - {error_info.get('Message')}")
        return data
    except json.JSONDecodeError as e:
        raise Exception(f"JSON解析失败: {e}")

def execute_recovery_command(timestamp, date, secret_id, secret_key, region, 
                           instance_id, work_directory, user, encoded_command):
    """执行故障恢复命令"""
    time.sleep(STABILIZATION_DELAY)  # 等待实例稳定
    
    # 执行TAT命令
    command_response = run_tat_command(
        timestamp, date, secret_id, secret_key, region, 
        instance_id, work_directory, user, encoded_command
    )
    
    # 解析命令响应
    cmd_data = safe_json_loads(command_response)
    invocation_id = cmd_data["Response"]["InvocationId"]
    tat_result_response = query_tat_command(timestamp, date, secret_id, secret_key, region, invocation_id)
    
    # 解析TAT查询结果并检查任务状态
    tat_result = safe_json_loads(tat_result_response)
    invocation_task_set = tat_result.get("Response", {}).get("InvocationTaskSet", [])
    
    if not invocation_task_set:
        print(f"未找到任务执行记录: {invocation_id}")
        return f"{instance_id} 命令执行记录未找到"
    
    # 持续检查任务状态直到不是RUNNING
    task_status = invocation_task_set[0].get("TaskStatus", "")
    print(f"初始任务状态: {task_status}")
    
    # 如果任务状态是RUNNING，持续轮询直到完成
    polling_attempt = 1
    while task_status == "RUNNING":
        print(f"第{polling_attempt}次轮询，任务仍在运行中，等待{RETRY_DELAY}秒后重新检查...")
        time.sleep(RETRY_DELAY)
        
        # 重新查询任务状态 - 使用query_tat_command获取最新状态
        print(f"正在使用query_tat_command查询任务ID: {invocation_id} 的最新状态...")
        
        # 使用新的时间戳确保获取最新数据
        current_timestamp = int(time.time())
        current_date = datetime.utcfromtimestamp(current_timestamp).strftime("%Y-%m-%d")
        
        tat_result_response = query_tat_command(current_timestamp, current_date, secret_id, secret_key, region, invocation_id)
        tat_result = safe_json_loads(tat_result_response)
        invocation_task_set = tat_result.get("Response", {}).get("InvocationTaskSet", [])
        
        if not invocation_task_set:
            print(f"轮询过程中任务记录丢失: {invocation_id}")
            return f"{instance_id} 任务执行过程中记录丢失"
        
        # 更新任务状态 - 这是关键的更新步骤
        new_task_status = invocation_task_set[0].get("TaskStatus", "")
        print(f"第{polling_attempt}次轮询，任务状态从 '{task_status}' 更新为 '{new_task_status}'")
        task_status = new_task_status
        polling_attempt += 1
        
        # 防止无限轮询，设置最大轮询次数
        if polling_attempt > MAX_RETRY_ATTEMPTS:
            print(f"任务轮询超时，已轮询{MAX_RETRY_ATTEMPTS}次，任务状态仍为: {task_status}")
            return f"{instance_id} 任务执行超时，当前状态: {task_status}"
    
    # 任务已完成，获取最新的任务信息用于最终状态检查
    # 如果没有进入轮询循环，需要确保使用最新的invocation_task_set
    if polling_attempt == 1:
        # 初始状态就不是RUNNING，使用原始查询结果
        current_task_info = invocation_task_set[0]
    else:
        # 经过轮询，使用最新的任务信息
        current_task_info = invocation_task_set[0] if invocation_task_set else {}
    
    # 任务已完成，检查最终状态
    print(f"最终任务状态: {task_status}")
    
    # 只有TaskStatus为SUCCESS才返回成功，其他任何状态都返回失败
    if task_status == "SUCCESS":
        print(f"实例 {instance_id} 故障自愈成功！")
        return f"{instance_id} 故障自愈成功！"
    else:
        # 获取详细错误信息
        error_info = current_task_info.get("ErrorInfo", "未知错误")
        exit_code = current_task_info.get("TaskResult", {}).get("ExitCode", "N/A")
        
        print(f"实例 {instance_id} 故障自愈失败！")
        print(f"任务状态: {task_status}")
        print(f"错误信息: {error_info}")
        print(f"退出代码: {exit_code}")
        
        raise Exception(f"{instance_id} 故障自愈失败！")

def main_handler(event, context):
    """主处理函数 - CVM故障自愈"""
    timestamp = int(time.time())
    date = datetime.utcfromtimestamp(timestamp).strftime("%Y-%m-%d")
    
    # 验证环境变量
    env_vars, error_msg = validate_environment_variables()
    if error_msg:
        return error_msg
    
    assert env_vars is not None
    secret_id, secret_key = env_vars['secretID'], env_vars['secretKey']
    work_directory, user = env_vars['work_Directory'], env_vars['work_User']
    run_command = env_vars['run_Command']
    
    # 解析事件参数
    try:
        instance_id, region = event['subject'].strip(), event['region'].strip()
    except KeyError as e:
        error_msg = f"事件参数缺失: {e}"
        print(error_msg)
        return error_msg
    
    # 编码命令
    assert run_command is not None
    encoded_command = base64.b64encode(run_command.encode('utf-8')).decode('utf-8')
    
    # 检查实例状态 - RUNNING状态只检查一次，其他状态重试6次
    for attempt in range(1, MAX_RETRY_ATTEMPTS + 1):
        status_data = safe_json_loads(get_cvm_status(timestamp, date, secret_id, secret_key, region, instance_id))
        
        instance_set = status_data.get("Response", {}).get("InstanceSet", [])
        if not instance_set:
            raise Exception(f"实例 {instance_id} 不存在或无权限访问")
        
        instance_state = instance_set[0]["InstanceState"]
        print(f"第{attempt}次检查，实例状态: {instance_state}")
        
        if instance_state == RUNNING_STATE:
            # RUNNING状态直接执行，不需要重试
            return execute_recovery_command(
                timestamp, date, secret_id, secret_key, region,
                instance_id, work_directory, user, encoded_command
            )
        else:
            # 非RUNNING状态，需要重试检查
            if attempt < MAX_RETRY_ATTEMPTS:
                print(f"实例状态为 {instance_state}，等待{RETRY_DELAY}秒后重试...")
                time.sleep(RETRY_DELAY)
            else:
                print(f"实例状态为 {instance_state}，已达到最大重试次数")
                raise Exception(f"{instance_id} 故障自愈失败！")
