/**************************************************
Nodejs6.10-GetCosObject
TIPS: 
1. cos-nodejs-sdk-v5 do not support the use of promise and async/await

REFERENCE: 
1. https://github.com/tencentyun/scf-demo-repo -  DEMO repository
2. https://cloud.tencent.com/document/product/436/12264 - COS-NODE-SDK document
***************************************************/

const COS = require('cos-nodejs-sdk-v5')
const fs = require('fs')

// The cos authentication information
// 使用 cos 所需的鉴权/配置信息
const APPID = 'xxx' // Replace it with your Appid, 请替换为您的腾讯云Appid
const SECRET_ID = 'xxx' // Replace it with your SecretId, 请替换为您的 SecretId
const SECRET_KEY = 'xxx' // Replace it with your SecretKey, 请替换为您的 SecretKey
const REGION = 'ap-guangzhou' // Replace it with your bucket's region, 请替换为您bucket所在的地域

// Initialize cosSDK
const cosInst = new COS({
  SecretId: SECRET_ID,
  SecretKey: SECRET_KEY
})
// This part is used to solve cosSDK-getObjec do not support promise
// 暂时解决cosSDK-getObject不支持promise的问题
cosInst.getObjectPromise = function(params) {
  return new Promise((resolve, reject) => {
    cosInst.getObject(params, function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

exports.main_handler = (event, context, callback) => {
  console.log('Start main handler')
  let promiseArr = []
  /**
   * Ger original data from uploaded pictures and write them into temporary directory /tmp/
   * 从cos上传的图片中，获取元数据，并写入到临时目录/tmp/中
   */
  for (let record of event['Records']) {
    const bucket = `${record['cos']['cosBucket']['name']}-${APPID}`
    let key = record['cos']['cosObject']['key']
    key = key.replace(`/${APPID}/${record['cos']['cosBucket']['name']}/`, '') // Ectract the name of picture, 抽取出图片的名称
    console.log('Key is: ', key)
    const downloadPath = `/tmp/${key}`
    promiseArr.push(
      cosInst
        .getObjectPromise({
          Bucket: bucket,
          Region: REGION,
          Key: key
        })
        .then(res => {
          fs.writeFileSync(downloadPath, res['Body'])
          console.log('Download file success: ', key)
        })
        .catch(e => {
          throw (
            `Error getting object ${key} from bucket ${bucket}. Error message: ${JSON.stringify(
              e
            )}`
          )
        })
    )
  }
  Promise.all(promiseArr).then(() => callback(null, 'Success').catch(e=>callback(e,'Fail')))
}
