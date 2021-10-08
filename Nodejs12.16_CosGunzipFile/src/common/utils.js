/* eslint-disable prefer-destructuring */
/* eslint-disable no-restricted-syntax */
'use strict';

const { URL } = require('url');
const { pipeline } = require('stream');
const { inspect } = require('util');

/**
 * parse params from event and process.env
 */
function getParams(event) {
  const {
    TENCENTCLOUD_SECRETID: secretId,
    TENCENTCLOUD_SECRETKEY: secretKey,
    TENCENTCLOUD_SESSIONTOKEN: token,
    Records = [],
    targetBucket,
    targetRegion,
    targetPrefix = '',
    extraRootDir = 'dirnameAndBasename',
    defaultHashCheck = 'false',
    parentRequestId,
    ...args
  } = {
    ...process.env,
    ...event,
  };

  if (!Records.length && !parentRequestId) {
    throw new Error('this function is not trigger by cos or parent function, refuse to execute');
  } else if (parentRequestId) {
    logger({
      title: `this function is trigger by parent function, parent request id is ${parentRequestId}`,
    });
  } else if (Records.length) {
    logger({ title: 'this function is trigger by cos' });
  }

  const objects = Records.map((item) => {
    let url = item.cos.cosObject.url;
    if (!url && item.cos.cosObject.key && item.event && item.event.eventQueue) {
      const { 3: cosRegion } = item.event.eventQueue.split(':');
      const [appid, bucketName, ...keyArgs] = item.cos.cosObject.key
        .slice(1)
        .split('/');
      const cosKey = keyArgs.join('/');
      const cosBucket = `${bucketName}-${appid}`;
      url = `https://${cosBucket}.cos.${cosRegion}.myqcloud.com/${cosKey}`;
    }
    return parseUrl({ url });
  });
  const { bucket, region, key } = objects[0] || {};

  const missingParams = [
    { key: 'targetBucket', value: targetBucket },
    { key: 'targetRegion', value: targetRegion },
    { key: 'TENCENTCLOUD_SECRETID', value: secretId },
    { key: 'TENCENTCLOUD_SECRETKEY', value: secretKey },
    // { key: 'TENCENTCLOUD_SESSIONTOKEN', value: token },
  ]
    .filter(item => !item.value)
    .map(item => item.key);

  if (missingParams.length) {
    throw new Error(`params parsed error, missing params: ${missingParams.join(', ')}`);
  }

  return {
    secretId,
    secretKey,
    token,
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    defaultHashCheck: ['true', true].includes(defaultHashCheck),
    ...args,
  };
}

/**
 * parse cos url to get the bucket, region, key message
 */
function parseUrl({ url }) {
  const { host, pathname } = new URL(url);
  const { 1: bucket, 2: region } = host.match(/^([^/]*)\.cos\.([^/]*)\.myqcloud\.com$/);
  return {
    bucket,
    region,
    key: decodeURIComponent(pathname.slice(1)),
  };
}

/**
 * print log message
 */
function logger({ messages = [], title = '', data = {} }) {
  const messageList = [...messages, title];
  for (const key in data) {
    const value = data[key];
    try {
      messageList.push(`${key}: ${inspect(value, { depth: 20 })}`);
    } catch (err) {
      messageList.push(`${key}: [inspect error]`);
    }
  }
  const result = `${messageList.filter(Boolean).join('\n')}`;
  console.log(`${result}\n\n`);
  return result;
}

/**
 * get retry function
 */
function retry({ maxTryTime = 3, func }) {
  return async (...args) => {
    let err;
    let tryTime = 0;
    while (tryTime < maxTryTime) {
      tryTime += 1;
      try {
        const res = await func(...args);
        return res;
      } catch (e) {
        err = e;
      }
    }
    throw err;
  };
}

/**
 * get log summary
 */
function getLogSummary({ name = '', results }) {
  let success = 0;
  let total = 0;
  const details = [];
  const limit = 20;
  const truncated = results.length > limit;
  const hasError = results.filter(item => item.error).length > 0;
  for (const { params, result, error } of results) {
    if (error) {
      if (details.length < limit) {
        details.push(`TaskStatus: fail, Params: ${JSON.stringify(params)}, Error: ${inspect(error, { depth: 10 })}`);
      }
    } else {
      if (details.length < limit && !(truncated && hasError)) {
        details.push(`TaskStatus: success, Params: ${JSON.stringify(params)}, Result: ${JSON.stringify(result)}`);
      }
      success += 1;
    }
    total += 1;
  }
  return {
    status: success < total ? 'fail' : 'success',
    messages: [
      `Result: ${name} ${
        success === total ? 'success' : 'fail'
      }, success: ${success}, total: ${total}`,
      ...details,
    ].filter(Boolean),
  };
}

/**
 * sleep logic
 */
function sleep(duration) {
  return new Promise(r => setTimeout(r, duration));
}

/**
 * get stream pipeline promise
 */
function streamPipelinePromise(streams) {
  return new Promise((resolve, reject) => {
    pipeline(streams, (err, ...args) => {
      if (err) {
        reject(err);
      } else {
        resolve(...args);
      }
    });
  });
}

module.exports = {
  getParams,
  logger,
  retry,
  getLogSummary,
  sleep,
  streamPipelinePromise,
};
