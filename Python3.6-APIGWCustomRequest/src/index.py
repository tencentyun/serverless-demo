# -*- coding: utf8 -*-

def handler_header(event, response):
    replace_headers = {} # 需要替换或者新增的header
    remove_headers = [] # 需要删除的header

    header_parameters = event.get("headerParameters") # 客户端原始请求的header内容
    if header_parameters is None or not isinstance(header_parameters, dict):
        print("Invalid event.headerParameters")
        return

    # 示例：替换或新增 header1
    replace_headers["header1"] = "header1"

    # 示例：删除 header2
    if header_parameters.get("header2") is not None:
        remove_headers.append("header2")
    
    # replace_headers 和 remove_headers 至少有一个非空
    if len(replace_headers) < 1 and len(remove_headers) < 1:
        print("Invalid custom request headers")
        return

    response["replace_headers"] = replace_headers
    response["remove_headers"] = remove_headers


def handler_body(event, response):
    replace_body = "" # 替换之后的body内容

    body = event.get("body") # 客户端原始请求的body内容

    # 示例：替换body
    if body is not None:
        replace_body = "hello world"

    # replace_body 必须为字符串类型
    if not isinstance(replace_body, str):
        print("Invalid custom request body")
        return

    response["replace_body"] = replace_body


def handler_query(event, response):
    replace_querys = {} # 需要替换或者新增的query
    remove_querys = [] # 需要删除的query

    query_parameters = event.get("queryStringParameters") # 客户端原始请求的query内容
    if query_parameters is None or not isinstance(query_parameters, dict):
        print("Invalid  event.queryStringParameters")
        return

    # 示例：替换或新增 query1
    replace_querys["query1"] = "query1"

    # 示例：删除原始请求中的 query2
    if query_parameters.get("query2") is not None:
        remove_querys.append("query2")

    # replace_querys 和 remove_querys 至少有一个非空
    if len(replace_querys) < 1 and len(remove_querys) < 1:
        print("Invalid custom request querys")
        return

    response["replace_querys"] = replace_querys
    response["remove_querys"] = remove_querys


def main_handler(event, context):
    response = {}

    # 自定义header处理函数，插件自定义内容未勾选Header时，可删除该函数
    handler_header(event, response) 

    # 自定义body处理函数，插件自定义内容未勾选Body时，可删除该函数
    handler_body(event, response) 

    # 自定义query处理函数，插件自定义内容未勾选Query时，可删除该函数
    handler_query(event, response)

    return response