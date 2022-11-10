'use strict';

exports.main_handler = async (event, context, callback) => {
    const body=event['body']
    var params = null
    // 底层的类型是string
    if(typeof body === 'string') params = JSON.parse(body)
    else params = body

    var {domainName, clientIp, hookType, ttl, ips} = params

    //打印客户端出口IP的具体信息
    //此处为示例代码，可以根据具体使用场景进行调整

    var request = require('request');
    const getIpInfo_url = 'http://cip.cc/' + params.clientIp;
    var IpInfo = null;

    request.post({url:getIpInfo_url , headers: {"User-Agent": "curl"}}, function(error, response, body) {
    if(!error && response.statusCode == 200){
    IpInfo = body;
    }
    console.log(IpInfo);
    })

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
