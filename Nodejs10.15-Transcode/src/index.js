/*************************************************************************
*****                                                                *****
*****    使用教程/readme ：                                            *****
*****    https://cloud.tencent.com/document/product/583/47071        *****
*****                                                                *****
**************************************************************************/
const COS = require('cos-nodejs-sdk-v5');
const fs = require('fs')
const child_process = require('child_process')
const util = require('util');

exports.main_handler = async (event, context) => {
  try {
    let downloadPath = ''
    let key = ''

    if (event.hasOwnProperty('body')) {
      downloadPath = event.body
      key = downloadPath.split('/').pop()
    } else if (event.hasOwnProperty('Records')) {
      key = event['Records'][0]['cos']['cosObject']['key'].split("/").pop()
      downloadPath = event['Records'][0]['cos']['cosObject']['url']
    } else {
      return {"code": 410, "errorMsg": "event does not come from COS or APIGW"}
    }

    key = `new-${key}`

    const uploadPath = `/tmp/${key}`
    const region = process.env.region
    const targetBucket = process.env['target_bucket']
    const targetPath = process.env['target_path'] || ''
    const secretId = process.env['TENCENTCLOUD_SECRETID']    
    const secretKey = process.env['TENCENTCLOUD_SECRETKEY']    
    const token = process.env['TENCENTCLOUD_SESSIONTOKEN']
    const cos = new COS({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token
    })

    child_process.execSync('cp ./ffmpeg /tmp/ffmpeg')

    child_process.execSync('chmod 755 /tmp/ffmpeg')

    child_process.execSync(`./ffmpeg -i ${downloadPath} -r 10 -b:a 32k ${uploadPath}`, { cwd: "/tmp" })

    const putObjectAync = util.promisify(cos.putObject.bind(cos))

    await putObjectAync({
      Bucket: targetBucket,
      Region: region,
      Key: `${targetPath}/${key}`,
      Body: fs.readFileSync(uploadPath)
    })

    fs.unlinkSync(uploadPath)


    return 'success'
  } catch (err) {
    console.log(err)
    return 'failed'
  }
}

