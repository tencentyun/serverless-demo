const crypto = require("crypto");
const request = require("request");
const fs = require("fs");
const qs = require("querystring");

const url = "https://vod.api.qcloud.com/v2/index.php";
let config = {
  SecretId: "",// Replace it with your SecretId please, 请替换为您的 SecretId
  SecretKey: "",// Replace it with your SecretKey please, 请替换为您的 SecretKey
  param: {
    output: {
      bucket: "",// Replace it with your uploading bucket's name, 请替换为解压后需要上传的bucket名
      dir: ""// Replace it with your uploading bucket's name, 请替换为解压后需要上传的bucket目录
    },
    mediaProcess: {
      transcode: {
        definition: [20]
      }
    }
  }
};

const RetryNum = 3;

//上传事件处理函数
exports.main_handler = async (event, context, callback, cusConfig) => {
  try {
    console.log("COS event detected");
    if (event && event.Records && Array.isArray(event.Records)) {
      for (let record of event.Records) {
        if (config.param.output.bucket == record.cos.cosBucket.name) {
          console.error("Input bucket and output bucket should be different!");
          continue;
        }

        if (
          record.event &&
          record.event.eventName.indexOf("cos:ObjectCreated") == 0
        ) {
          await handleInputRecord(record);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
};

function transcodeCheck(config) {
  try {
    if (!Array.isArray(config.param.mediaProcess.transcode.definition)) {
      return false;
    }

    if (!config.param.output.bucket) {
      return false;
    }
  } catch (err) {
    return false;
  }

  return true;
}

//视频转码
async function transcode(record) {
  try {
    let items = [];
    let result = null;
    for (let i = 0; i < RetryNum; i++) {
      try {
        result = await requestTranscode(genQueryUrl(record));
      } catch (err) {
        console.error(err);
        console.error("Request failed, please try again");
        continue;
      }
      break;
    }

    if (result == null) {
      console.error("ERROR!");
      for (let item of items) {
        item.resMessage = "error";
      }
    } else {
      console.log("Succeed");
      console.log(result);
      for (let item of items) {
        item.resCode = result.code;
        item.resMessage = result.codeDesc;
        item.vodTaskId = result.vodTaskId;
      }
    }
  } catch (err) {
    console.error(err);
  }
}

async function handleInputRecord(record) {
  //只监控文件上传
  console.log("File detected");
  if (!isValid(record)) {
    return;
  }

  if (transcodeCheck(config)) {
    await transcode(record);
  } else {
    console.log("Transcode error");
  }
}

let videoExtends = new Set([
  ".rmvb",
  ".mp4",
  ".3pg",
  ".mov",
  ".m4v",
  ".avi",
  ".mkv",
  ".flv",
  ".vob",
  ".wmv",
  ".asf",
  ".asx",
  ".dat"
]);

//Filtering files that aren't videos
//过滤非视频文件
function isValid(record) {
  let objectKey = new ObjectKey(record.cos.cosObject.key);

  if (objectKey.extend && videoExtends.has(objectKey.extend)) {
    return true;
  }

  let contentType = record.cos.cosObject.meta["Content-Type"];
  if (contentType.indexOf("video") != 0) {
    console.log("Neglecting non-video files");
    return false;
  }
  return true;
}

class ObjectKey {
  constructor(key) {
    let strs = key.split("/");
    this.appId = strs[1];
    this.bucket = strs[2];
    this.path = "/" + strs.slice(3, strs.length - 1).join("/");

    let longName = strs[strs.length - 1];
    let index = longName.lastIndexOf(".");
    if (index < 0) {
      this.name = longName;
      this.extend = "";
    } else {
      this.name = longName.substring(0, index);
      this.extend = longName.substring(index, longName.length);
    }
  }
}

//Transcodind request
//请求视频转码
function requestTranscode(queryUrl) {
  return new Promise(function (resolve, reject) {
    let proxy = "";
    if (config.PROXY) {
      proxy = config.PROXY;
    }
    console.log("Requesting start");
    request({ url: queryUrl, timeout: 5000, proxy }, function (
      error,
      response,
      body
    ) {
      //记录日志
      if (error) {
        reject(error);
        console.log("Requesting failed", error);
      } else {
        try {
          body = JSON.parse(body);
          console.log("Requesting succeed", body);
          if (body.code == 0) {
            resolve(body);
          } else {
            reject(body);
          }
        } catch (error) {
          reject(error);
        }
      }
    });
  });
}

function genQueryUrl(record) {
  let params = {};
  params["input.bucket"] = record.cos.cosBucket.name;
  let inputs = record.cos.cosObject.key.split("/");
  params["input.path"] = "/" + inputs.slice(3).join("/");
  params["output.bucket"] = config.param.output.bucket;
  if (config.param.output.dir) {
    params["output.dir"] = config.param.output.dir;
  } else {
    params["output.dir"] =
      "/" + inputs.slice(3, inputs.length - 1).join("/") + "/";
  }
  params["mediaProcess.transcode.definition.0"] =
    config.param.mediaProcess.transcode.definition[0];
  params["Action"] = "ProcessCosMedia";
  params["Region"] = record.cos.cosBucket.region;
  params["Timestamp"] = Math.round(Date.now() / 1000);
  params["Nonce"] = Math.round(Math.random() * 65535);
  params["SecretId"] = config.SecretId;
  console.log("params generating");
  console.log(params);
  let queryUrl = genUrl(params, config.SecretKey);
  console.log("query genertating");
  console.log(queryUrl);
  return queryUrl;
}

function genUrl(params, secretKey) {
  var keys = Object.keys(params);
  keys.sort();
  let qstr = "";
  keys.forEach(function (key) {
    var val = params[key];
    if (
      val === undefined ||
      val === null ||
      (typeof val === "number" && isNaN(val))
    ) {
      val = "";
    }
    qstr += "&" + (key.indexOf("_") ? key.replace(/_/g, ".") : key) + "=" + val;
  });
  qstr = qstr.slice(1);
  let signature = sign(
    "GET" + "vod.api.qcloud.com/v2/index.php" + "?" + qstr,
    secretKey
  );
  params.Signature = signature;
  return url + "?" + qs.stringify(params);
}

function sign(str, secretKey) {
  var hmac = crypto.createHmac("sha1", secretKey || "");
  return hmac.update(new Buffer(str, "utf8")).digest("base64");
}
