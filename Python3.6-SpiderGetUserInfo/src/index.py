

#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import os
import requests
import re


def get_json(params):
    """获取网页中json数据"""
    url = 'https://m.weibo.cn/api/container/getIndex?'
    r = requests.get(url, params=params)
    return r.json()

def get_user_info(user_id):
    """获取用户信息"""
    params = {'containerid': '100505' + str(user_id)}
    js = get_json(params)
    if js['ok']:
        info = js['data']['userInfo']
        user_info = {}
        user_info['id'] = user_id
        user_info['screen_name'] = info.get('screen_name', '')
        user_info['gender'] = info.get('gender', '')
        user_info['statuses_count'] = info.get('statuses_count', 0)
        user_info['followers_count'] = info.get('followers_count', 0)
        user_info['follow_count'] = info.get('follow_count', 0)
        user_info['description'] = info.get('description', '')
        user_info['verified_reason'] = info.get('verified_reason', '')
        return user_info


def filter_emoji(desstr, restr=''):
    # 过滤表情
    res = re.compile(u'[\U00010000-\U0010ffff\\uD800-\\uDBFF\\uDC00-\\uDFFF]')
    return res.sub(restr, desstr)

def main_handler(event, context):
    user_id = event["user_id"]
    user_info = json.loads(filter_emoji(json.dumps(get_user_info(user_id))))
    return user_info