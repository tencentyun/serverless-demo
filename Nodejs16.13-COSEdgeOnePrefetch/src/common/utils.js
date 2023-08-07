"use strict";

const { URL } = require("url");
const { inspect } = require("util");

/**
 * parse param from event and process.env
 */
function getParams({ Records = [] }) {
  const objects = Records.map((item) =>
    parseUrl({ url: item.cos.cosObject.url })
  );
  const {
    env: {
      TENCENTCLOUD_SECRETID: secretId,
      TENCENTCLOUD_SECRETKEY: secretKey,
      TENCENTCLOUD_SESSIONTOKEN: token,
      ...args
    },
  } = process;

  const edgeoneDomains = [];

  for (const key in args) {
    if (/^eoDomains/.test(key)) {
      edgeoneDomains.push(args[key]);
    }
  }

  return {
    objects,
    edgeoneDomains,
    secretId,
    secretKey,
    token,
    zoneId: args["ZoneId"],
  };
}

/**
 * parse cos url to get the bucket, region, key message
 */
function parseUrl({ url }) {
  const { host, pathname } = new URL(url);
  const { 1: bucket, 2: region } = host.match(
    /^([^\/]*)\.cos\.([^\/]*)\.myqcloud\.com$/
  );
  return {
    bucket,
    region,
    key: decodeURIComponent(pathname.slice(1)),
  };
}

/**
 * get cos object url
 */
function getObjectUrl({
  cosInstance,
  bucket: Bucket,
  region: Region,
  key: Key,
  origin = "",
}) {
  const url = cosInstance.getObjectUrl({
    Bucket,
    Region,
    Key,
    Sign: false,
  });
  const { protocol, host } = new URL(url);
  return url.replace(`${protocol}//${host}`, origin);
}

/**
 * print log message
 */
function logger({ messages = [], title = "", data = {} }) {
  const messageList = [...messages, title];
  for (const key in data) {
    const value = data[key];
    try {
      messageList.push(`${key}: ${inspect(value, { depth: 20 })}`);
    } catch (err) {
      messageList.push(`${key}: [inspect error]`);
    }
  }
  const result = `${messageList.filter(Boolean).join("\n")}`;
  console.log(`${result}\n\n`);
  return result;
}

/**
 * get log summary
 */
function getLogSummary(results) {
  let success = 0,
    total = 0;
  const details = [];
  for (const { params, result, error } of results) {
    const { Targets } = params;
    const urlStr = Targets.map((item) => item.replace(/\?[^\/]*$/g, "")).join(
      ", "
    );
    if (error) {
      const { code, requestId, message } = error;
      if (code && requestId) {
        details.push(
          `RequestStatus: fail, Code: ${code}, Message: ${message}, Targets: ${urlStr}, RequestId: ${requestId}`
        );
      } else {
        details.push(
          `RequestStatus: fail, ${inspect(error, {
            depth: 20,
          })}, Targets: ${urlStr}`
        );
      }
    } else {
      const { JobId, RequestId, FailedList = [] } = result;
      if (JobId && RequestId) {
        details.push(
          `RequestStatus: success, JobId: ${JobId}, RequestId: ${RequestId}, FailedList: ${JSON.stringify(FailedList)}`
        );
      } else {
        details.push(
          `RequestStatus: success, ${inspect(result, { depth: 20 })}`
        );
      }
      success += Targets.length - FailedList.length;
    }
    total += Targets.length;
  }
  return {
    status: success < total ? "fail" : "success",
    messages: [
      `Result: edgeone prefetch ${
        success === total ? "success" : "fail"
      }, success: ${success}, total: ${total}`,
      ...details,
    ].filter(Boolean),
  };
}

/**
 * sleep logic
 */
function sleep(duration) {
  return new Promise((r) => setTimeout(r, duration));
}

/**
 * get number from message string
 */
function getMatchNumber(str, reg) {
  const result = str.match(reg)[0];
  return result.replace(/[^0-9]/g, "") * 1;
}

module.exports = {
  getParams,
  getObjectUrl,
  logger,
  getLogSummary,
  sleep,
  getMatchNumber,
};
