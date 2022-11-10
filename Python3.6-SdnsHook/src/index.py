# -*- coding: utf8 -*-
import json
import requests

def main_handler(event, context):
    body = None
    if(type("") == type(event['body'])) :
        body = json.loads(event['body'])
    else :
        body = event['body']

    params = {
        'domainName': body['domainName'],
        'clientIp': body['clientIp'],
        'hookType': body['hookType'],
        'ttl': body['ttl'],
        'ips': body['ips'],
    }
    
    print(params)

    getIpInfoUrl = 'http://cip.cc/' + params['clientIp']
    header={"User-Agent": "curl"}
    res = requests.get(getIpInfoUrl, headers=header)

    ipInfo = ''
    if res.status_code == 200:
        ipInfo = res.text    
    print(ipInfo)

    response = {
        'ttl': params['ttl'],
        'ips': []
    }
    # 当解析一个不存在的域名或者解析失败时，默认为0或空串，
    # 而通过自定义解析功能，可将0排除，获取自定义的解析记录
    for ip in params['ips']:
        if ip != 0 and ip != '0' and ip != '':
            response['ips'].append(ip)


    if params['hookType'] == "BEFORE_WRITE_CACHE": 
        response['ttl'] = 100
        response['ips'].append('1.1.1.1')
    
    if params['hookType'] == "BEFORE_WRITE_RESPONSE":  
        response['ttl'] = 200
        response['ips'].append('2.2.2.2')

    return(response)


