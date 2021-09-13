# -*- coding: utf-8 -*-


def header_auth(event, response):
    header_parameters = event.get("headerParameters")  # 客户端原始请求的header内容，其中认证参数都被转成了小写
    if header_parameters is None or not isinstance(header_parameters, dict):
        return

    # 示例：通过 header-auth 进行认证 
    if header_parameters.get("header-auth") == "apigw":
        response["api-auth"] = False # 未通过认证


def body_auth(event, response):
    body = event.get("body")   # 客户端请求的body内容

    # 示例：通过 body 进行认证 
    if body is None:
        response["api-auth"] = False # 未通过认证


def query_auth(event, response):
    query_parameters = event.get("queryStringParameters")  # 客户端请求的query内容，其中认证参数都被转成了小写
    if query_parameters is None or not isinstance(query_parameters, dict):
        return

    # 示例：通过 query-auth 进行认证 
    if query_parameters.get("query-auth") == "apigw":
        response["api-auth"] = False # 未通过认证


def main_handler(event, context):
    response = {
        "api-auth": True  # 必须返回，表示认证结果
    }

    # 自定义header认证
    header_auth(event, response)

    # 自定义body认证
    body_auth(event, response)

    # 自定义query认证
    query_auth(event, response)

    return response