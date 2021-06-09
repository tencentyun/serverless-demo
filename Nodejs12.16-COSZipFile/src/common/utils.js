/* eslint-disable camelcase */
/* eslint-disable no-unneeded-ternary */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const requestPromise = require('request-promise');
const request = require('request');
const { inspect } = require('util');
const { URL } = require('url');
const requestPromiseRetry = retry({ func: requestPromise });

/**
 * parse params from event and process.env
 */
function getParams(event, { tencentcloud_appid }) {
  let body = event;
  try {
    if (event.body) {
      body = JSON.parse(event.body);
    }
  } catch (err) {
    throw new Error('request body is not a json string');
  }

  const {
    TENCENTCLOUD_SECRETID: secretId,
    TENCENTCLOUD_SECRETKEY: secretKey,
    TENCENTCLOUD_SESSIONTOKEN: token,
    bucket,
    region,
    key,
    sourceList = [],
    sourceConfigList = [],
    flatten = false,
    ...args
  } = {
    ...process.env,
    ...body,
  };

  const missingParams = [
    { key: 'bucket', value: bucket },
    { key: 'region', value: region },
    { key: 'key', value: key },
    // { key: 'sourceList', value: sourceList },
    // { key: 'sourceConfigList', value: sourceConfigList },
    { key: 'TENCENTCLOUD_SECRETID', value: secretId },
    { key: 'TENCENTCLOUD_SECRETKEY', value: secretKey },
    // { key: 'TENCENTCLOUD_SESSIONTOKEN', value: token },
  ]
    .filter(item => !item.value)
    .map(item => item.key);

  const errorList = [];

  if (missingParams.length) {
    errorList.push(`missing params: ${missingParams.join(', ')}`);
  }

  if (!sourceList.length && !sourceConfigList.length) {
    errorList.push('sourceList or sourceConfigList should be set');
  }

  if (errorList.length) {
    throw new Error(`params parsed error, ${errorList.join(', ')}`);
  }

  if (!bucket.endsWith(`${tencentcloud_appid}`)) {
    throw new Error(`${bucket} does not belong to the owner`);
  }

  return {
    secretId,
    secretKey,
    token,
    bucket,
    region,
    key,
    sourceList,
    sourceConfigList,
    flatten,
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
 * try to add signature on cos url
 */
function tryAddCosSignature({ cosSdkInstance, url }) {
  const { host, pathname, searchParams } = new URL(url);
  if (/^([^.]*)\.cos\.([^.]*)\.myqcloud\.com$/.test(host)) {
    // if url already has signature, return url
    if (searchParams.has('q-signature')) {
      return url;
    }
    const { 1: Bucket, 2: Region } = host.match(/^([^.]*)\.cos\.([^.]*)\.myqcloud\.com$/);
    const Key = decodeURIComponent(pathname.slice(1));
    return cosSdkInstance.getObjectUrl({
      Bucket,
      Region,
      Key,
      Sign: true,
      Expires: 24 * 60 * 60,
    });
  }
  return url;
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
        url: url.replace(/(\?[\s\S]*)/g, ''),
        statusCode: response.statusCode,
        headers: response.headers || {},
      });
    }
    req = null;
  });
  return req;
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
  requestPromiseRetry,
  tryAddCosSignature,
  getRangeStreamFromUrl,
  sleep,
  retry,
  logger,
  getLogSummary,
};
