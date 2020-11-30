/*************************************************************************
*****                                                                *****
*****    使用教程/readme ：                                            *****
*****    https://cloud.tencent.com/document/product/583/47075        *****
*****                                                                *****
**************************************************************************/

const COS = require('cos-nodejs-sdk-v5');
const TextToSVG = require('text-to-svg');
const util = require('util');
const fs = require('fs');
const sharp = require('sharp');

function formateResponse(statusCode, body) {
  return {
    isBase64Encoded: false,
    statusCode,
    headers: {"Content-Type": "text", "Access-Control-Allow-Origin": "*"},
    body
  }
}

exports.main_handler = async (event, context) => {
  try {
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

    const userName = event && event.body || ''

    if (!userName.length) {
      return formateResponse(410, 'Error: Name is null')
    } else if (userName.length > 15) {
      return formateResponse(420, 'Error: Name is too long!')
    }

    const uploadPath = `/tmp/邀请函-${userName}-${new Date().valueOf()}-ServerlessDays.jpg`

    const textToSvg = TextToSVG.loadSync('./STXINWEI.TTF')
    const svg = textToSvg.getSVG(userName, {
      x: 0,
      y: 0,
      fontSize: 90,
      anchor: "top",
      attributes: {
        fill: "white"
      }
    });

    const textImageBuffer = Buffer.from(svg)
    const image = await sharp('./source.jpg')
    const textImage = await sharp(textImageBuffer)
    const imageMetas = await image.metadata()
    const textImageMetas = await textImage.metadata()

    await image.composite([
      {
        input: textImageBuffer,
        left: (imageMetas.width - textImageMetas.width) / 2,
        top: imageMetas.height / 2 - 90
      }
    ]).toFile(uploadPath)

    
    const putObjectAync = util.promisify(cos.putObject.bind(cos))

    const key = `${targetPath}/${uploadPath.split('/').pop()}`
    const downloadPath = `https://${targetBucket}.cos.${region}.myqcloud.com${key}`

    await putObjectAync({
      Bucket: targetBucket,
      Region: region,
      Key: key,
      Body: fs.readFileSync(uploadPath)
    })

    fs.unlinkSync(uploadPath)


    return formateResponse(200, downloadPath)
  } catch (err) {
    console.log(err)
    return formateResponse(500, err && err.message || 'Internal Error')
  }
}
