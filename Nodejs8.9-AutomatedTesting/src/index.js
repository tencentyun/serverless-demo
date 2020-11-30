/**************************************************
Nodejs8.9-AutomatedTesting
TIPS: 
1. There is no CMQ SDK for node
   CMQ暂时没有node版本的SDK

Reference: 
1. https://cloud.tencent.com/document/product/583/19504 - Function test（python）
2. https://cloud.tencent.com/document/product/406/5851 - CMQ interface files
***************************************************/

const Capi = require('qcloudapi-sdk')
const request = require('request-promise')

// The cmq authentication information
// 使用 cmq 所需的鉴权/配置信息
const SECRET_ID = 'xxx' // Replace it with your SecretId , 请替换为您的 SecretId
const SECRET_KEY = 'xxx' // Replace it with your SecretKey, 请替换为您的 SecretKey
const CMQ_TOPIC_NAME = 'CMQ_TOPIC_NAME' // Replace it with your Topic name, 请替换为您的 Topic 名称
const CMQ_REGION = 'gz' // The region of your cmq topic, cmq主题所在地域

// While fails, the email notify list, 拨测失败后，告警邮件需要通知的邮箱列表
const EMAIL_NOTIFY_LIST = ['******@qq.com', '******@qq.com']

// While fails, the email sending the error message, please replace it with your own email address
// 拨测失败后，发出告警邮件的邮箱，请根据您自身设置的邮箱地址进行修改
const FROM_ADDR = '******@qq.com'

// The test url list
// 拨测网址列表
const TEST_URL_LIST = ['http://wrong.tencent.com', 'http://www.qq.com']

/**Simple CMQ-SDK */
function CMQRequestHelper(SecretId, SecretKey) {
  // Generate the CMQ api
  // CMQ云api构建
  this.requestHelper = new Capi({
    SecretId,
    SecretKey,
    serviceType: `cmq-topic-${CMQ_REGION}`
  })
  this.inited = true
}
CMQRequestHelper.prototype.publishMessage = async function(
  region,
  topicName,
  msgBody
) {
  if (!this.inited) throw Error('Instantiate CMQRequestHelper first please')
  const self = this
  let params = {
    Region: region,
    Action: 'PublishMessage',
    topicName,
    msgBody
  }
  try {
    return await self.requestHelper.request(params)
  } catch (e) {
    return e
  }
}

const cmqRequestInst = new CMQRequestHelper(SECRET_ID, SECRET_KEY)

async function sendCMQ(body) {
  for (let toAddr of EMAIL_NOTIFY_LIST) {
    await cmqRequestInst.publishMessage(
      CMQ_REGION,
      CMQ_TOPIC_NAME,
      JSON.stringify({
        fromAddr: FROM_ADDR,
        toAddr: toAddr,
        title: 'Please note: PlayCheck Error ',
        body: body
      })
    )
  }
  console.log('sendCMQ: ', body)
}

async function testUrl(urlList) {
  let errorInfo = []
  for (let url of urlList) {
    try {
      await request({
        url,
        timeout: 3000
      })
    } catch (e) {
      errorInfo.push(e)
    }
  }
  return await sendCMQ(errorInfo.join('\r\n'))
}

exports.main_handler = async (event, context, callback) => {
  return await testUrl(TEST_URL_LIST)
}
