
/*************************************************************************
*****                                                                *****
*****    使用教程/readme ：                                            *****
*****    https://cloud.tencent.com/document/product/583/47076        *****
*****                                                                *****
**************************************************************************/

const fs = require('fs')
const util = require('util')
const path = require('path')
const unzipper = require('unzipper')
const COS = require('cos-nodejs-sdk-v5')

const TEMP_PATH = '/tmp'

function traversal(dir) {
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
  const targetRegion = process.env.targetRegion
  const targetBucket = process.env['targetBucket']
  const targetPrefix = process.env['targetPrefix'] || ''

  const secretId = process.env['TENCENTCLOUD_SECRETID']    
  const secretKey = process.env['TENCENTCLOUD_SECRETKEY']    
  const token = process.env['TENCENTCLOUD_SESSIONTOKEN']
  const cos = new COS({
    SecretId: secretId,
    SecretKey: secretKey,
    XCosSecurityToken: token
  })
  const getObjectSync = util.promisify(cos.getObject.bind(cos))
  const putObjectSync = util.promisify(cos.putObject.bind(cos))

  let promiseArr = []

  for (let record of event['Records']) {
    console.log(record)
    const cosBucket = record['cos']['cosBucket']
    let key = record['cos']['cosObject']['key']
    const { name: fileName, appid: appId, s3Region: srcRegion } = cosBucket
    const srcBucket = `${fileName}-${appId}`
    key = key.replace(`/${appId}/${fileName}/`, '')
    console.log('Key is: ', key)
    if (!key.endsWith('.zip')) {
      console.log('Extract fail.This is not a zip file: ', key)
      return
    }

    const downloadPath = path.join(TEMP_PATH, key)

    try {
      const res = await getObjectSync({
        Bucket: srcBucket,
        Region: srcRegion,
        Key: key
      })

      console.log('res', res)

      fs.mkdirSync(downloadPath.split('/').slice(0, downloadPath.split('/').length - 1).join('/'), { recursive: true })
      fs.writeFileSync(downloadPath, res['Body'])
      console.log('Download file success: ', key)
    } catch (e) {
      console.log(
        `Error getting object ${key} from bucket ${srcBucket}. Error message: `,
        e
      )
      return 'Fail'
    }

    try {
      const extractPath = `${TEMP_PATH}/unpack`
      try {
        fs.statSync(extractPath)
      } catch (err) {
        fs.mkdirSync(extractPath, { recursive: true })
      }

      await fs
        .createReadStream(downloadPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .promise()


      const files = traversal(extractPath)

      console.log(files)

      promiseArr = files.map(file => {
        const params = {
          Bucket: targetBucket,
          Region: targetRegion,
          Key: path.join(targetPrefix, file.replace(extractPath, '')),
          Body: fs.readFileSync(file)
        }
        return putObjectSync(params)
      })
    } catch (e) {
      console.log('Unzip file error. Error message:', e)
      return 'Fail'
    }
    try {
      await Promise.all(promiseArr)
    } catch (e) {
      console.log(
        `Error uploading file to bucket ${targetBucket}. Error message: `,
        e
      )
      return 'Fail'
    }
  }
  return 'Success'
}


