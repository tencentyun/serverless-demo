/* eslint-disable no-restricted-syntax */
'use strict';

const requestPromise = require('request-promise');
const request = require('request');
const { inspect } = require('util');
const { URL } = require('url');
const { PassThrough } = require('stream');

const requestPromiseRetry = retry({ func: requestPromise });

/**
 * parse params from event and process.env
 */
function getParams({
  Time: triggerTime,
  Type: triggerType,
  parentRequestId,
  ...eventArgs
}) {
  const {
    TENCENTCLOUD_SECRETID: secretId,
    TENCENTCLOUD_SECRETKEY: secretKey,
    TENCENTCLOUD_SESSIONTOKEN: token,
    instanceList: instanceListStr,
    targetBucket,
    targetRegion,
    targetPrefix = '',
    backTrackDays = '3', // please do not set backTrackDays too large, it may cause scf timeout
    subTaskDelay = '5000', // please do not set subTaskDelay too large, it may cause sub task delay too long
    ...args
  } = {
    ...process.env,
    ...eventArgs,
  };

  if (triggerType !== 'Timer' && !parentRequestId) {
    throw new Error('this function is not trigger by timer or parent function, refuse to execute');
  } else if (parentRequestId) {
    logger({
      title: `this function is trigger by parent function, parent request id is ${parentRequestId}`,
    });
  } else if (triggerType === 'Timer') {
    logger({ title: 'this function is trigger by timer' });
  }

  const missingParams = [
    { key: 'instanceList', value: instanceListStr },
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

  let instanceList = instanceListStr;

  try {
    instanceList = JSON.parse(instanceListStr);
  } catch (err) {
    throw new Error('params parsed error, instanceList should be a json array string');
  }

  return {
    secretId,
    secretKey,
    token,
    instanceList,
    targetBucket,
    targetRegion,
    targetPrefix,
    backTrackDays: parseInt(backTrackDays, 10),
    subTaskDelay: parseInt(subTaskDelay, 10),
    triggerTime,
    triggerType,
    ...args,
  };
}
/**
 * parse url to get the key message
 */
function parseUrl(url) {
  const { pathname } = new URL(url);
  return {
    key: decodeURIComponent(pathname.slice(1)),
  };
}
/**
 * get meta headers from url
 */
async function getMetaFromUrl(url) {
  let meta;
  try {
    const { headers } = await requestPromiseRetry({
      uri: url,
      method: 'GET',
      headers: {
        range: 'bytes=0-0',
      },
      transform: (body, response) => response,
    });
    meta = headers;
  } catch (err) {
    if (err.statusCode !== 416) {
      throw err;
    }
    // if response http code is 416, assume that file size is 0
    const { headers } = await requestPromiseRetry({
      uri: url,
      method: 'GET',
      transform: (body, response) => response,
    });
    meta = headers;
  }
  meta['content-length'] = meta['content-range']
    ? parseInt(meta['content-range'].split('/')[1], 10)
    : 0;
  return meta;
}
/**
 * get request stream with range
 */
function getRangeStreamFromUrl({
  url,
  start,
  end,
  timeout = 24 * 60 * 60 * 1000,
}) {
  const headers =    start || end
    ? {
      range: `bytes=${start}-${end - 1}`,
    }
    : {};
  let req = request({
    url,
    timeout,
    headers,
  }).on('response', (response) => {
    if (!`${response.statusCode}`.startsWith('2')) {
      req.emit('error', {
        statusCode: response.statusCode,
        headers: response.headers || {},
      });
    }
    req = null;
  });
  return req;
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
 * sleep logic
 */
function sleep(duration) {
  return new Promise(r => setTimeout(r, duration));
}
/**
 * get retry function
 */
function retry({ maxTryTime = 3, duration = 1000, func }) {
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
        await sleep(duration);
      }
    }
    throw err;
  };
}
/**
 * get uuid
 */
function getUUID() {
  return `${new Date().getTime()}_${Math.random()}`;
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
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
  readStreamAddPassThrough,
  sleep,
  retry,
  getUUID,
  logger,
  getLogSummary,
};
