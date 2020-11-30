
/*************************************************************************
*****                                                                *****
*****    使用教程/readme ：                                            *****
*****    https://cloud.tencent.com/document/product/583/30722        *****
*****                                                                *****
**************************************************************************/

const fs = require("fs")
const cos = require("cos-nodejs-sdk-v5")
const local_path = "/tmp/local_file.txt"
const config = {
  appId: '', // Replace it with your Appid please, 请替换为您的腾讯云Appid
  secretId: '', // Replace it with your SecretId please, 请替换为您的 SecretId
  secretKey: '', // Replace it with your SecretKey please, 请替换为您的 SecretKey
  bucketName: ''
}


const cosSdk = new cos({
  SecretId: config.secretId,
  SecretKey: config.secretKey
})

exports.main_handler = async (event, context, callback) => {
  try {
    let out = fs.createWriteStream(local_path, {
      flags: "a",
      encoding: "utf8"
    });
  
    let records = event.Records || []
  
    records.forEach(r => {
      if (r.Ckafka) {
        let msg = r.Ckafka.msgBody
  
        out.write(msg)
        out.write("\r\n")
      }
    })
  
    out.end()
  
    // Upload it into cos, 上传到cos
    await putCosObject(cosSdk, {
      Bucket: `${config.bucketName}-${config.appId}`,
      Region: 'ap-guangzhou',
      Key: `ckafka_${Date.now()}.txt`,
      Body: fs.createReadStream(local_path)
    })
  
    console.log('uploading succeed')
    return true
  } catch (err) {
    console.log(err)
    return false
  }
};

function putCosObject(cos, params) {
  return new Promise(function (resolve, reject) {
    cos.putObject(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}