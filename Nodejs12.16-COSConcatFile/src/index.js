/* eslint-disable no-param-reassign */
'use strict';

const CosSdk = require('cos-nodejs-sdk-v5');
const CosConcatFileTask = require('./common/CosConcatFileTask');
const {
  getParams,
  requestPromiseRetry,
  tryAddCosSignature,
  tryStringify,
  logger,
  getLogSummary,
} = require('./common/utils');

exports.main_handler = async (event, context) => {
  try {
    /**
     * parse param from event and process.env
     */
    const {
      secretId,
      secretKey,
      token,
      bucket,
      region,
      key,
      sourceList,
      sourceConfigList,
    } = getParams(event, context);

    logger({
      title: 'param is parsed success, param as follow: ',
      data: { event },
    });

    const cosSdkInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
    });

    for (const { url } of sourceConfigList) {
      let content = await requestPromiseRetry({
        uri: tryAddCosSignature({ cosSdkInstance, url }),
        method: 'GET',
      });
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }
      const list = JSON.parse(content);
      list.forEach(item => sourceList.push(item));
    }

    const task = new CosConcatFileTask({
      cosSdkInstance,
      sourceList,
      targetBucket: bucket,
      targetRegion: region,
      targetKey: key,
    });

    const result = await task.runTask();

    logger({
      title: 'cos concat file full logs:',
      data: result,
    });

    const { status, messages } = getLogSummary({
      name: 'cos concat file',
      results: [result],
    });

    logger({
      messages: messages.map(item => item.replace(/, /g, '\n')),
    });

    const { Location, Bucket, Key, ETag } = result.result || {};

    if (status !== 'success') {
      throw result.error
        ? result.error.error || result.error.message || result.error
        : {};
    }
    return {
      code: 0,
      message: 'cos concat file success',
      data: {
        Location,
        Bucket,
        Key,
        ETag,
      },
    };
  } catch (err) {
    const error = err.stack ? { message: err.message } : err;
    const response = {
      code: -1,
      message: 'cos concat file fail',
      error,
    };
    if (process.env.SCF_ASYNC_RUN_ENABLE !== '0') {
      throw tryStringify(response);
    }
    return response;
  } finally {
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
