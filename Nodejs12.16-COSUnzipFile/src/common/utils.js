/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const COS = require('cos-nodejs-sdk-v5');
const path = require('path');
const { PassThrough } = require('stream');
const { URL } = require('url');
const { detect, decode } = require('./encoding');
const { promisify, inspect } = require('util');
const { isFunction } = require('lodash');

/**
 * get source and target message from event and process.env
 */
function getParams({ parentRequestId, ...eventArgs }) {
  const {
    TENCENTCLOUD_SECRETID: SecretId,
    TENCENTCLOUD_SECRETKEY: SecretKey,
    TENCENTCLOUD_SESSIONTOKEN: XCosSecurityToken,
    Records = [],
    targetBucket,
    targetRegion,
    targetPrefix = '',
    extraRootDir = 'basename',
    pathTraversalProtection = 'true',
    recursive = 'false',
    rangeLimit = '50000',
    currentRange,
  } = {
    ...process.env,
    ...eventArgs,
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

  const objectList = Records.map(item => parseUrl({
    url: item.cos.cosObject.url,
  }));

  const { Bucket, Region, Key } = objectList[0];

  const missingParams = [
    { key: 'TENCENTCLOUD_SECRETID', value: SecretId },
    { key: 'TENCENTCLOUD_SECRETKEY', value: SecretKey },
    // { key: 'TENCENTCLOUD_SESSIONTOKEN', value: XCosSecurityToken },
  ]
    .filter(item => !item.value)
    .map(item => item.key);

  if (missingParams.length) {
    throw new Error(`params parsed error, missing params: ${missingParams.join(', ')}`);
  }

  return {
    Bucket,
    Region,
    Key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    pathTraversalProtection: ['true', true].includes(pathTraversalProtection),
    recursive: ['true', true].includes(recursive),
    rangeLimit: parseInt(rangeLimit, 10),
    currentRange,
    SecretId,
    SecretKey,
    XCosSecurityToken,
  };
}
/**
 * parse cos url to get the Bucket, Region, Key message
 */
function parseUrl({ url }) {
  const { host, pathname } = new URL(url);
  const { 1: Bucket, 2: Region } = host.match(/^([^/]*)\.cos\.([^/]*)\.myqcloud\.com$/);
  return {
    Bucket,
    Region,
    Key: decodeURIComponent(pathname.slice(1)),
  };
}
/**
 * get uuid
 */
function getUUID() {
  return `${new Date().getTime()}_${Math.random()}`;
}
/**
 * get range
 */
function getRange({ start, step, max }) {
  return [start, Math.min(start + step - 1, max)];
}
/**
 * append promisify or retry logic methods
 */
function appendRetryPromisify({
  target = {},
  keys = [],
  maxTryTime = 1,
  promisify: needPromisify = true,
}) {
  const suffix = `${maxTryTime > 1 ? 'Retry' : ''}${
    needPromisify ? 'Promise' : ''
  }`;
  for (const key of keys) {
    const value = target[key];
    if (isFunction(value)) {
      const func = needPromisify
        ? promisify(value).bind(target)
        : value.bind(target);
      target[`${key}${suffix}`] = retry({ maxTryTime, func });
    }
  }
}
/**
 * init cos-nodejs-sdk-v5 instance，append promisify methods add retry logic
 */
function initCosInstance({ SecretId, SecretKey, XCosSecurityToken, ...args }) {
  const cosInstance = new COS({
    SecretId,
    SecretKey,
    XCosSecurityToken,
    ...args,
  });
  const keys = Object.keys(COS.prototype);
  const noRetryKeys = ['getObject', 'putObject'];
  appendRetryPromisify({
    target: cosInstance,
    keys: noRetryKeys,
    maxTryTime: 1,
  });
  appendRetryPromisify({
    target: cosInstance,
    keys: keys.filter(key => !noRetryKeys.includes(key)),
    maxTryTime: 3,
  });
  return cosInstance;
}
/**
 * try to decode buffer by detect encoding
 */
function bufferToString(buffer) {
  const { encoding } = detect(buffer);
  return decode(buffer, encoding);
}
/**
 * get file basename and extname
 */
function parseFileName(fileName) {
  const dirname = path.dirname(fileName);
  const extname = path.extname(fileName);
  const basename = path.basename(fileName, extname);
  return {
    dirname,
    basename,
    extname,
  };
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
 * promisify a stream
 */
function streamPromise(stream, resolveEvent = 'finish', rejectEvent = 'error') {
  return new Promise((resolve, reject) => {
    stream.once(resolveEvent, resolve);
    stream.once(rejectEvent, reject);
  });
}
/**
 * ReadStream add PassThrough, when ReadStream emit error, proxy error to PassThrough
 */
function readStreamAddPassThrough(readStream) {
  const passThrough = new PassThrough();
  readStream.on('error', err => passThrough.emit('error', err));
  return readStream.pipe(passThrough);
}
/**
 * print log message
 */
function logger({ messages = [], title = '', data = {} }) {
  const messageList = [...messages, title];
  for (const key in data) {
    const value = data[key];
    try {
      messageList.push(`${key}: ${inspect(value, { depth: 10 })}`);
    } catch (err) {
      messageList.push(`${key}: [inspect error]`);
    }
  }
  const result = `${messageList.filter(Boolean).join('\n')}`;
  console.log(`${result}\n\n`);
  return result;
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
module.exports = {
  getParams,
  getUUID,
  getRange,
  appendRetryPromisify,
  initCosInstance,
  bufferToString,
  parseFileName,
  retry,
  streamPromise,
  readStreamAddPassThrough,
  logger,
  getLogSummary,
};
