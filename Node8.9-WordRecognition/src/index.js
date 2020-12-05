/**************************************************
Node8.9 - WordRecognition
TIPS: 
1. Tencent cloud also has other tools to deal with pictures, you can view api documents for more details
   腾讯云图像智能还有其他能力, 请参考api文档
2. If triggered by API gateway, the only difference is retrive data
   如若为API网关触发方式, 只是取数据的方式有所不同

Reference: 
1. https://cloud.tencent.com/document/product/866/17594 - Tencent cloud image document
2. https://www.npmjs.com/package/tcb-ai - tcb-ai document
***************************************************/

const config = {
  appId: '', // Replace it with your Appid please, 请替换为您的腾讯云Appid
  secretId: '', // Replace it with your SecretId please, 请替换为您的 SecretId
  secretKey: '', // Replace it with your SecretKey please, 请替换为您的 SecretKey
}

const { ImageClient } = require("tcb-ai");

const imgClient = new ImageClient({
  AppId: config.appId,
  SecretId: config.secretId,
  SecretKey: config.secretKey
});

exports.main_handler = async (event, context, callback) => {
  console.log("Start main handler");
  try {
    for (let record of event["Records"]) {
      console.log(record);
  
      // Get image's url, 获取图片地址
      const cosObject = record.cos.cosObject;
      const imgUrl = cosObject.url;
      // Extract image's name, 抽取出图片的名称
      console.log("imgUrl is: ", imgUrl);
  
      const res = await imgClient.ocrIdCard({
        data: {
          card_type: 0,
          url_list: [imgUrl]
        }
      });
      console.log("ocr result is :", JSON.stringify(res));
  
    }
    return "Success"
  } catch (err) {
    console.log('Failed', err)
    return "Fail"
  }
};
