#!/usr/bin/env python
# -*- coding: utf-8 -*-

import json
import csv
import requests

def write_user_info(user_info):
    """输出用户信息"""
    tmp_path = '/mnt/spider/user_info.csv'
    with open(tmp_path, 'a', encoding='utf-8', newline='') as f:
        csv.writer(f).writerow([user_info['id'],
                                user_info['screen_name'],
                                '女' if user_info['gender'] == 'f' else '男',
                                user_info['statuses_count'],
                                user_info['followers_count'],
                                user_info['follow_count'],
                                'https://m.weibo.cn/profile/%s' % user_info['id'],
                                user_info['verified_reason'],
                                user_info['description']])
    return tmp_path

def standardize(item):
    """标准化信息，去除乱码"""
    for k, v in item.items():
        if 'bool' not in str(type(v)) and 'int' not in str(type(v)) and 'list' not in str(
                type(v)) and 'long' not in str(type(v)):
            item[k] = v.replace(u'\u200b', '').encode(errors='ignore').decode()
    return item

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


def main_handler(event, context):
    user_info= event["user_info"]
    user_info = standardize(user_info)
    tmp_path = write_user_info(user_info)
    return {"path":tmp_path}
