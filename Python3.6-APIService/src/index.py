# -*- coding: utf-8 -*-

import sys
import logging
import json

logging.basicConfig(level=logging.INFO, stream=sys.stdout)
logger = logging.getLogger()
logger.setLevel(level=logging.INFO)

logger.info('Loading function')

testArticleInfo=[
    {"id":1,"category":"blog","title":"hello world","content":"first blog! hello world!","time":"2017-12-05 13:45"},
    {"id":2,"category":"blog","title":"record info","content":"record work and study!","time":"2017-12-06 08:22"},
    {"id":3,"category":"python","title":"python study","content":"python study for 2.7","time":"2017-12-06 18:32"},
]

def main_handler(event,content):
    logger.info('start main_handler')
    if "requestContext" not in event.keys():
        return {"errorCode":410,"errorMsg":"event is not come from api gateway"}
    if event["requestContext"]["path"] != "/article/{articleId}" and event["requestContext"]["path"] != "/article":
        return {"errorCode":411,"errorMsg":"request is not from setting api path"}
    if event["requestContext"]["path"] == "/article" and event["requestContext"]["httpMethod"] == "GET": #获取文章列表
        retList = []
        for article in testArticleInfo:
            retItem = {}
            retItem["id"] = article["id"]
            retItem["category"] = article["category"]
            retItem["title"] = article["title"]
            retItem["time"] = article["time"]
            retList.append(retItem)
        return retList
    if event["requestContext"]["path"] == "/article/{articleId}" and event["requestContext"]["httpMethod"] == "GET": #获取文章内容
        articleId = int(event["pathParameters"]["articleId"])
        for article in testArticleInfo:
            if article["id"] == articleId:
                return article
        return {"errorCode":412,"errorMsg":"article is not found"}
    return {"errorCode":413,"errorMsg":"request is not correctly execute"}