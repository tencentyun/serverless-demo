# -*- coding: utf8 -*-
import json

def main_handler(event, context):
    body = json.loads(event['body'])

    print(body)
    params = {
        'domainName': body['domainName'],
        'clientIp': body['clientIp'],
        'location': body['location'],
        'hookType': body['hookType'],
        'ttl': body['ttl'],
        'ips': body['ips'],
    }
    
    print(params)
    response = {
        'ttl': params['ttl'],
        'ips': params['ips']
    }


    if params['hookType'] == "BEFORE_WRITE_CACHE": 
        response['ttl'] = 100
        response['ips'].append('1.1.1.1')
    
    if params['hookType'] == "BEFORE_WRITE_RESPONSE":  
        response['ttl'] = 200
        response['ips'].append('2.2.2.2')

    return(response)

