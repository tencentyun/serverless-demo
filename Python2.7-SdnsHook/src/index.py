# -*- coding: utf8 -*-
import json

def main_handler(event, context):
    response = {}

    if "domainName" in event.keys():
        response['domainName'] = event['domainName']
    elif "clientIp" in event.keys():
        response['clientIp'] = event['clientIp']
    elif "location" in event.keys():
        response['location'] = event['location']
    elif "ttl" in event.keys():
        response['ttl'] = event['ttl']
    elif "ips" in event.keys():
        response['ips'] = event['ips']
    else:
        return {"code": 410, "errorMsg": "param error"}

    if event['hookType'] == "BEFORE_WRITE_CACHE": 
        print("BEFORE_WRITE_CACHE")
    
    if event['hookType'] == "BEFORE_WRITE_RESPONSE":  
        print("BEFORE_WRITE_RESPONSE")
    
    response['ttl'] = 180

    return(response)

