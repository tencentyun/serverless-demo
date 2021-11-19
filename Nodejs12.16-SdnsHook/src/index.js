'use strict';

exports.main_handler = async (event, context, callback) => {
    
    var {domainName, clientIp, location, hookType, ttl, ips} = event

    var response = {
        domainName: domainName,
        clientIp: clientIp,
        location: location,
        ttl: ttl,
        ips: ips
    };

    if (hookType=="BEFORE_WRITE_CACHE") {
        console.log("BEFORE_WRITE_CACHE")
    }
    if (hookType=="BEFORE_WRITE_RESPONSE") {
        response.cacheKey = 120
        console.log("BEFORE_WRITE_RESPONSE")
    }
  
    return response
  }