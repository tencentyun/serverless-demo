# -*- coding: utf8 -*-
import time

def handler_header(event, header_parameters, response):
    replace_headers = {} # 需要替换或者新增的header
    remove_headers = [] # 需要删除的header

    # 示例：替换或新增 header1
    replace_headers["header1"] = "header1"

    # 示例：删除 X-Api-Serviceid
    remove_headers.append("X-Api-Serviceid")

    response["replace_headers"] = replace_headers
    response["remove_headers"] = remove_headers


def handler_body(event, header_parameters, response):
    replace_body = "" # 替换之后的body内容
    body = event.get("body") # 原始body内容

    # 示例：echo
    if body is not None:
        replace_body = body

    # replace_body 必须为字符串类型
    if not isinstance(replace_body, str):
        print("Invalid replace body")
        return

    response["replace_body"] = replace_body
    
    # 是否需要对replace_body 进行base64解码
    response["is_base64_encoded"] = header_parameters.get("is_base64_encoded")


def handler_status(event, header_parameters, response):
    status = header_parameters.get("status")

    # 示例：后端错误处理
    if status != None and status != 200:
       response["replace_status"] = 200
       response["replace_body"] = "custom response, upstream_status is " + str(status)
       response["is_base64_encoded"] = False


def main_handler(event, context):

    # 自定义内容勾选status时必须返回replace_status字段
    response = {
        "replace_status" : 200 
    }

    # header 参数
    header_parameters = event.get("headerParameters") # 原始header内容
    if header_parameters is None or not isinstance(header_parameters, dict):
        header_parameters = {}


    # 1. handler_xxx() 为对应的自定义处理函数，response的返回内容都是增量更新
    # 2. 对于每个handler_xxx()，下列情况不会对响应结果进行自定义处理：
    #     （1） 控制台未勾选该自定义内容
    #     （2） 未调用handler_xxx()
    #     （3） response未返回或者返回内容不符合规范

    # 自定义header处理函数，控制台未勾选该自定义内容可删除
    handler_header(event, header_parameters, response) 

    # 自定义body处理函数，控制台未勾选该自定义内容可删除
    handler_body(event, header_parameters, response) 

    # 自定义status处理函数，控制台未勾选该自定义内容可删除
    handler_status(event, header_parameters, response)

    return response