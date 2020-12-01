
/**************************************************
* 功能：1.发送短信 2.登录（校验短信验证码）
* 函数运行的前提条件： 
1.创建模板函数后，请先添加函数运行角色，并给该角色关联短信QcloudSMSFullAccess权限。
2.本服务用到redis存储验证码，请先申请redis资源，并将redis的host和密码设置成环境变量。
3.去云短信控制台申请短信模板和签名
* 详细请参考：https://github.com/tencentyun/scf-demo-repo/tree/master/Nodejs8.9-SmsVerificationCode
***************************************************/

'use strict';
const redis = require('ioredis');
const tencentcloud = require('tencentcloud-sdk-nodejs');
const queryParse = require('querystring')
const expireTime = 5 * 60;//验证码有效期5分钟

exports.main_handler = async (event, context, callback) => {
  let queryString = event.queryString // get形式
  if(event.httpMethod === "POST") { // post形式
    queryString = queryParse.parse(event.body)
  }
  
  if(!queryString || !queryString.method || !queryString.phone) {
    return {
      codeStr: 'InValidParam',
      msg: "缺少参数"
    }
  }
  const redisStore = new redis({
    port: 6369, // Redis instance port, redis实例端口
    host: process.env.REDIS_HOST, // Redis instance host, redis实例host
    family: 4,
    password: process.env.REDIS_PASSWORD, // Redis instance password, redis实例密码
    db: 0
  });
  if(queryString.method === "getSms") {
    return await getSms(queryString, redisStore)
  } else if(queryString.method === "login") {
    return await loginSms(queryString, redisStore)
  }
}

/*
* 功能：登录，校验验证码
*/
async function loginSms(queryString, redisStore) {
  if(!queryString.code) {
    return {
        codeStr: 'MissingCode',
        errorMessage: "缺少验证码参数"
    }
  }
  const redisResult = await redisPromise(redisStore, queryString)
  if(!redisResult) {//没有找到记录
    return {
      codeStr: 'CodeHasExpired',
      msg: "验证码已过期"
    }
  }
  let result = JSON.parse(redisResult)
  
  if(!result || result.used || result.num >= 3) {
    return {
      codeStr: 'CodeHasValid',
      msg: "验证码已失效"
    }
  }
  
  if(result.code == queryString.code) { //验证码校验正确
    updateRedis(redisStore, queryString.phone, result, true) //将验证码更新为已使用
    // 验证码校验通过，执行登录逻辑
    console.log('校验验证码成功')
    return {
      codeStr: 'Success',
      msg: '校验验证码成功'
    }
  } else { // 验证码校验失败
    updateRedis(redisStore, queryString.phone, result, false)
    return {
      codeStr: 'CodeIsError',
      msg: "请检查手机号和验证码是否正确"
    }
  }
}
// 更新redis状态
function updateRedis(redisStore, phone, result, used) {
  const sessionCode = {
    code: result.code,
    sessionId: result.sessionId,
    num: ++result.num, //验证次数，最多可验证3次
    used: used //true-已使用，false-未使用
  }
  redisStore.set('sms_' + phone, JSON.stringify(sessionCode));
  if(used) {
    redisStore.expire('sms_' + phone, 0);
  } else {
    redisStore.expire('sms_' + phone, expireTime);
  }
}
/*
 * 功能：根据手机号获取短信验证码
 */
async function getSms(queryString, redisStore) {
  const code = Math.random().toString().slice(-6);//生成6位数随机验证码
  const sessionCode = {
      code: code,
      num: 0, //验证次数，最多可验证3次
      used: false //false-未使用，true-已使用
  }
  redisStore.set('sms_' + queryString.phone, JSON.stringify(sessionCode));
  redisStore.expire('sms_' + queryString.phone, expireTime);

  let queryResult = await sendSms(queryString.phone, code)
  return queryResult
}
/*
 * 功能：通过sdk调用短信api发送短信
 * 参数 手机号、短信验证码
 */
async function sendSms(phone, code) {
  const SmsClient = tencentcloud.sms.v20190711.Client;
  const Credential = tencentcloud.common.Credential;
  const ClientProfile = tencentcloud.common.ClientProfile;
  const HttpProfile = tencentcloud.common.HttpProfile;
  const secretId = process.env.TENCENTCLOUD_SECRETID;
  const secretKey = process.env.TENCENTCLOUD_SECRETKEY;
  const token = process.env.TENCENTCLOUD_SESSIONTOKEN;

  let cred = new Credential(secretId, secretKey, token);
  let httpProfile = new HttpProfile();
  httpProfile.endpoint = "sms.tencentcloudapi.com";
  let clientProfile = new ClientProfile();
  clientProfile.httpProfile = httpProfile;
  let client = new SmsClient(cred, "ap-guangzhou", clientProfile);

  let req = {
      PhoneNumberSet: ["+" + phone], //大陆手机号861856624****
      TemplateID: process.env.SMS_TEMPLATE_ID, //腾讯云短信模板id
      Sign: process.env.SMS_SIGN, //腾讯云短信签名
      TemplateParamSet: [code],
      SmsSdkAppid: process.env.SMS_SDKAPPID //短信应用id
  }
  
  let queryResult = await smsPromise(client, req)
  return queryResult
}

async function smsPromise(client, req) {
  return new Promise((resolve, reject) => {
      client.SendSms(req, function(errMsg, response) {
          if (errMsg) {
              reject(errMsg)
          } else {
              if(response.SendStatusSet && response.SendStatusSet[0] && response.SendStatusSet[0].Code === "Ok") {
                  resolve({
                      codeStr: response.SendStatusSet[0].Code,
                      msg: response.SendStatusSet[0].Message
                  })
              } else {
                  resolve({
                      codeStr: response.SendStatusSet[0].Code,
                      msg: response.SendStatusSet[0].Message
                  })
              }
          }                
      });
  })
}

async function redisPromise(redisStore, queryString) {
  return new Promise((res, rej) => {
    redisStore.get('sms_' + queryString.phone, function (err, result) {
      if (err) {
        rej(err)
      }
      res(result)
    });
  })
}
