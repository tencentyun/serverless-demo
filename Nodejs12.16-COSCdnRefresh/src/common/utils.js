/* eslint-disable no-restricted-syntax */
'use strict';

const { inspect } = require('util');
const { URL } = require('url');

/**
 * parse params from event and process.env
 */
function getParams(event) {
  const {
    TENCENTCLOUD_SECRETID: secretId,
    TENCENTCLOUD_SECRETKEY: secretKey,
    TENCENTCLOUD_SESSIONTOKEN: token,
    Records: records,
    ObjectInfo: objectInfo,
    ...args
  } = {
    ...process.env,
    ...event,
  };

  let objects = [];
  let triggerType = '';

  const missingParams = [
    { key: 'TENCENTCLOUD_SECRETID', value: secretId },
    { key: 'TENCENTCLOUD_SECRETKEY', value: secretKey },
    // { key: 'TENCENTCLOUD_SESSIONTOKEN', value: token },
  ]
    .filter(item => !item.value)
    .map(item => item.key);

  if (missingParams.length) {
    throw new Error(`params parsed error, missing params: ${missingParams.join(', ')}`);
  }

  const cdnHosts = [];

  for (const key in args) {
    if (/^cdnHosts/.test(key)) {
      cdnHosts.push(args[key]);
    }
  }

  try {
    if (records) {
      const cosRecords = records.filter(item => item.cos);
      const ckafkaRecords = records.filter(item => item.Ckafka);
      const allCosRecords = [];
      cosRecords.forEach(item => allCosRecords.push(item));
      for (const item of ckafkaRecords) {
        const cosEvent = JSON.parse(item.Ckafka.msgBody);
        cosEvent.Records.forEach(item => allCosRecords.push(item));
      }
      objects = allCosRecords.map(item => parseUrl(item.cos.cosObject.url));
      triggerType = 'cosTrigger';
    } else if (objectInfo) {
      const { BucketId: bucket, Region: region, Object: key } = objectInfo;
      objects = [
        {
          bucket,
          region,
          key,
        },
      ];
      triggerType = 'cosWorkflow';
    }
    if (objects.length === 0) {
      throw objects;
    }
  } catch (err) {
    throw new Error('this function is not trigger by cos trigger or cos workflow, refuse to execute');
  }

  return {
    secretId,
    secretKey,
    token,
    objects,
    triggerType,
    cdnHosts,
    ...args,
  };
}
/**
 * parse url to get the key message
 */
function parseUrl(url) {
  const { host, pathname } = new URL(url);
  const { 1: bucket, 2: region } = host.match(/^([^/]*)\.cos\.([^/]*)\.myqcloud\.com$/);
  return {
    bucket,
    region,
    key: decodeURIComponent(pathname.slice(1)),
  };
}
/**
 * replace the placeholder of template by map
 */
function replaceTemplate(template = '', map = {}) {
  const reg = Object.keys(map)
    .map(key => key.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1'))
    .join('|');
  return template.replace(
    new RegExp(reg, 'gm'),
    placeholer => map[placeholer] || '',
  );
}
/**
 * get number from message string
 */
function getMatchNumber(str, reg) {
  const result = str.match(reg)[0];
  return result.replace(/[^0-9]/g, '') * 1;
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
        if (tryTime < maxTryTime) {
          await sleep(duration);
        }
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
  replaceTemplate,
  getMatchNumber,
  sleep,
  retry,
  logger,
  getLogSummary,
};
