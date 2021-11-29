'use strict';

exports.main_handler = async (event, context, callback) => {
    const body=event['body']
    var params = JSON.parse(body)

    var {domainName, clientIp, location, hookType, ttl, ips} = params

    var response = {
        ttl: ttl,
        ips: ips
    };
    
    if (hookType=="BEFORE_WRITE_CACHE") {
        response.ttl=100
        response.ips.push('1.1.1.1')
    }
    if (hookType=="BEFORE_WRITE_RESPONSE") {
        response.ttl=200
        response.ips.push('2.2.2.2')
    }

    return response
  }