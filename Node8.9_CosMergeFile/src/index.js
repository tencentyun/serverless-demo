const fs = require("fs")
const cos = require("cos-nodejs-sdk-v5")

const config = {
  appId: '', // Replace it with your Appid please, 请替换为您的腾讯云Appid
  secretId: '', // Replace it with your SecretId please,请替换为您的 SecretId
  secretKey: '', // Replace it with your SecretKey please, 请替换为您的 SecretKey
  inputBucketName: '',
  outoutBubketName: '',
  region: ''
}


const cosSdk = new cos({
  SecretId: config.secretId,
  SecretKey: config.secretKey
})

exports.main_handler = async (event, context, callback) => {
  try {
    // Get objects' information from bucket, 获取bucket中的条目信息
    let inputFiles = await getAllCosObject(cosSdk, {
      Bucket: `${config.inputBucketName}-${config.appId}`,
      Region: config.region
    })

    const local_file = `/tmp/local_file_${Date.now()}.txt`
    
    for(let inputFile of inputFiles) {
      await operateCos(cosSdk, 'getObject', {
        Bucket: `${config.inputBucketName}-${config.appId}`,
        Region: config.region,
        Key: inputFile.Key,
        Output: fs.createWriteStream(local_file, {
          flags: "a",
          encoding: "utf8"
        })
      })
    }

    // Write into another bucket, 写入另一个bucket
    await operateCos(cosSdk, 'putObject', {
      Bucket: `${config.outoutBubketName}-${config.appId}`,
      Region: config.region,
      Key: `merge_file_${Date.now()}.txt`,
      Body: fs.createReadStream(local_file)
    })

    console.log('文件合并并写入cos成功')

    return true
  } catch (err) {
    console.log(err)
    return false
  }
};


async function getAllCosObject(cos, params) {
  const per_page = 1000; // The max number of each page, 每页的数量
  let list = []
  let marker = ''

  let result

  do {
    result = await operateCos(cos, 'getBucket', {
      ...params,
      MaxKeys: per_page.toString(),
      Marker: marker
    })

    list = list.concat(result.Contents)

    // Recording the start point of next request, 记录下次请求起始位置
    marker = result.NextMarker
  } while (result.Contents.length >= per_page)

  return list
}

function operateCos(cos, handler, params) {
  return new Promise(function (resolve, reject) {
    cos[handler](params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

