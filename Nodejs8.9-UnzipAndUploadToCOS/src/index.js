/**************************************************
Node8.9-UnzipAndUploadToCOS
TIPS: 
1.cos-nodejs-sdk-v5 do not support the use of promise and async/await
  cos-nodejs-sdk-v5暂不支持promise和async/await用法

Reference: 
1. https://github.com/tencentyun/scf-demo-repo - the uploaded demo repo
2. https://cloud.tencent.com/document/product/436/12264 - COS-NODE-SDK document
***************************************************/

const fs = require('fs')
const path = require('path')
const unzipper = require('unzipper')
const COS = require('cos-nodejs-sdk-v5')

const config = {
  appId: '', // Replace it with your Appid please, 请替换为您的腾讯云Appid
  secretId: '', // Replace it with your SecretId please, 请替换为您的 SecretId
  secretKey: '', // Replace it with your SecretKey please, 请替换为您的 SecretKey
}

// cosSDK initialization
const cos = new COS({
  SecretId: config.secretId,
  SecretKey: config.secretKey
})


const REGION = 'ap-guangzhou' // Replace it with your bucket's reigon , 请替换为您bucket所在的地域
const BUCKET_UPLOAD = 'test1' // Replace it with your uploading bucket's name, 请替换为解压后需要上传的bucket名
const TEMP_PATH = '/tmp'

const traversal = function(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(function(file) {
    file = dir + '/' + file
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(traversal(file))
    } else {
      results.push(file)
    }
  })
  return results
}

exports.main_handler = async (event, context, callback) => {
  console.log('Start main handler')
  let promiseArr = []
  /**
   * Get original data from uploaded pictures and write into temporary directory /tmp/
   * 从cos上传的图片中，获取元数据，并写入到临时目录/tmp/中
   */
  for (let record of event['Records']) {
    console.log(record)
    const cosBucket = record.cos.cosBucket
    const cosObject = record.cos.cosObject
    const { name: fileName, appid: appId } = cosBucket
    const bucket = `${fileName}-${appId}`
    let key = cosObject.key
    key = key.replace(`/${appId}/${fileName}/`, '') // Extract the name of picture, 抽取出图片的名称
    console.log('Key is: ', key)
    if (!key.endsWith('.zip')) {
      console.log('Extract fail.This is not a zip file: ', key)
      return
    }
    const downloadPath = path.join(TEMP_PATH, key)

    try {
      const res = await getObject({
        Bucket: bucket,
        Region: REGION,
        Key: key
      })
      fs.writeFileSync(downloadPath, res['Body'])
      console.log('Download file success: ', key)
    } catch (e) {
      console.log(
        `Error getting object ${key} from bucket ${bucket}. Error message: `,
        e
      )
      return 'Fail'
    }

    try {
      const extractPath = path.join(TEMP_PATH, key.substring(0, key.length - 4))
      await fs
        .createReadStream(downloadPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise()

      const files = traversal(extractPath)

      promiseArr = files.map(file => {
        const params = {
          Bucket: `${BUCKET_UPLOAD}-${appId}`,
          Region: REGION,
          Key: file.split('/').pop(),
          Body: fs.readFileSync(file)
        }
        return putObject(params)
      })
    } catch (e) {
      console.log('Unzip file error. Error message:', e)
      return 'Fail'
    }
    try {
      await Promise.all(promiseArr)
    } catch (e) {
      console.log(
        `Error uploading file to bucket ${BUCKET_UPLOAD}. Error message: `,
        e
      )
      return 'Fail'
    }
  }
  return 'Success'
}


function getObject (params) {
  return new Promise((resolve, reject) => {
    cos.getObject(params, function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

function putObject (params) {
  return new Promise((resolve, reject) => {
    cos.putObject(params, function(err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
