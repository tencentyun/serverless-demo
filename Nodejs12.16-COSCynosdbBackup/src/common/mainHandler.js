/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
'use strict';

const requestCallback = require('./requestCallback');
const TimeoutWatcher = require('./TimeoutWatcher');
const ScfSdk = require('./ScfSdk');
const {
  getParams,
  getCosSdkInstance,
  requestPromiseRetry,
  tryAddCosSignature,
  tryStringify,
  logger,
  getLogSummary,
  parseUrl,
} = require('./utils');

module.exports = async ({
  event,
  context,
  name = 'cos task',
  runMainTask,
  cancelMainTask,
}) => {
  const extraMessage = {};
  let finalCallbackUrl;
  let finalWatcher;
  try {
    /**
     * set a timer to terminate the task, ensure log message is printed
     */
    finalWatcher = new TimeoutWatcher({
      timeLimit: context.time_limit_in_ms,
      error: new Error('task is timeout'),
      trigger(error) {
        if (cancelMainTask) {
          cancelMainTask(error);
        }
      },
    });

    logger({
      title: 'param as follow: ',
      data: { event },
    });

    Object.assign(extraMessage, {
      function: {
        functionName: context.function_name,
        functionRegion: context.tencentcloud_region,
        functionRequestId: context.request_id,
      },
    });

    /**
     * parse param from event and process.env
     */
    const params = getParams(event, context);
    const {
      secretId,
      secretKey,
      token,
      sourceList,
      sourceConfigList,
      extraData,
      callbackUrl,
    } = params;

    finalCallbackUrl = callbackUrl;

    Object.assign(extraMessage, {
      extraData,
    });

    logger({
      title: 'param is parsed success',
    });

    const cosSdkInstance = getCosSdkInstance({
      secretId,
      secretKey,
      token,
    });

    const scfSdkInstance = new ScfSdk({
      secretId,
      secretKey,
      token,
    });

    sourceConfigList.forEach((item) => {
      if (!item.url && item.bucket && item.region && item.key) {
        item.url = cosSdkInstance.getObjectUrl({
          Bucket: item.bucket,
          Region: item.region,
          Key: item.key,
          Sign: false,
        });
      }
      if (item.url && !(item.bucket && item.region && item.key)) {
        try {
          Object.assign(item, parseUrl(item.url));
        } catch (err) {}
      }
    });

    for (const { type, url, region } of sourceConfigList) {
      let content = await requestPromiseRetry({
        uri: tryAddCosSignature({ cosSdkInstance, url }),
        method: 'GET',
      });
      if (content.charCodeAt(0) === 0xfeff) {
        content = content.slice(1);
      }
      let list = JSON.parse(content);
      if (type === 'cosInventory') {
        const {
          files,
          fileFormat,
          fileSchema,
          destinationAppid,
          destinationBucket,
        } = JSON.parse(content);
        list = files.map(item => ({
          ...item,
          type: 'gzip',
          fileFormat,
          fileSchema,
          bucket: `${destinationBucket}-${destinationAppid}`,
          region,
        }));
      }
      list.forEach(item => sourceList.push(item));
    }

    sourceList.forEach((item) => {
      if (!item.url && item.bucket && item.region && item.key) {
        item.url = cosSdkInstance.getObjectUrl({
          Bucket: item.bucket,
          Region: item.region,
          Key: item.key,
          Sign: false,
        });
      }
      if (item.url && !(item.bucket && item.region && item.key)) {
        try {
          Object.assign(item, parseUrl(item.url));
        } catch (err) {}
      }
    });

    const { results, responseParams, responseError, responseResult } =      await runMainTask({
      cosSdkInstance,
      scfSdkInstance,
      ...params,
    });

    logger({
      title: `${name} full logs:`,
      data: results,
    });

    const { status, messages } = getLogSummary({ name, results });

    logger({
      messages,
    });

    let {
      params: firstParams = {},
      error: firstError,
      result: firstResult = {},
    } = results.find(item => Boolean(item.error)) || results[0] || {};

    if (firstError) {
      let depth = 0;
      while (firstError.error && depth < 10) {
        depth += 1;
        firstError = firstError.error;
      }
      if (firstError.stack) {
        firstError = {
          message: firstError.message,
        };
      }
    }

    const finalParams = responseParams || firstParams;
    const finalError = responseError || firstError;
    const finalResult = responseResult || firstResult;

    Object.assign(extraMessage, {
      params: finalParams,
    });

    if (status !== 'success') {
      throw finalError;
    }

    const response = {
      code: 0,
      message: `${name} success`,
      data: finalResult,
      ...extraMessage,
    };

    /**
     * request callback url
     */
    if (finalCallbackUrl) {
      await requestCallback({
        response,
        callbackUrl: finalCallbackUrl,
      });
    }

    return response;
  } catch (err) {
    const error = err.stack ? { message: err.message } : err;
    const response = {
      code: -1,
      message: `${name} fail`,
      error,
      ...extraMessage,
    };
    /**
     * request callback url
     */
    if (finalCallbackUrl) {
      await requestCallback({
        response,
        callbackUrl: finalCallbackUrl,
      });
    }
    if (process.env.SCF_ASYNC_RUN_ENABLE !== '0') {
      throw tryStringify(response);
    }
    return response;
  } finally {
    if (finalWatcher) {
      finalWatcher.clear();
      finalWatcher = null;
    }
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
