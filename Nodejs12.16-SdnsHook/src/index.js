'use strict';

exports.main_handler = async (event, context, callback) => {
    const body=event['body']
    var params = JSON.parse(body)

    var {domainName, clientIp, location, hookType, ttl, ips} = params

    var response = {
        ttl: ttl,
        ips: ips
    };
    
    // 当解析一个不存在的域名或者解析失败时，默认为0或空串，
    // 而通过自定义解析功能，可将0排除，获取自定义的解析记录
    response.ips = response.ips.filter(ip=>ip!=0);
    
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
