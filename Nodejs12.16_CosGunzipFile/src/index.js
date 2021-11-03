/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const CosSdk = require('cos-nodejs-sdk-v5');
const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosGunzipFileTask = require('./common/CosGunzipFileTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');

const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
  try {
    /**
     * set a timer to terminate the task, ensure log message is printed
     */
    let runningTask;
    const watcher = new TimeoutWatcher({
      timeLimit: context.time_limit_in_ms,
      trigger(error) {
        if (runningTask && runningTask.cancelTask) {
          runningTask.cancelTask(error);
        }
      },
      error: new Error('task is timeout'),
    });
    /**
     * parse params from event and process.env
     */
    const {
      bucket,
      region,
      key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      defaultHashCheck,
      secretId,
      secretKey,
      token,
    } = getParams(event, context);

    logger({
      title: 'params parsed success, params as follow: ',
      data: {
        bucket,
        region,
        key,
        targetBucket,
        targetRegion,
        targetPrefix,
        extraRootDir,
        defaultHashCheck,
        event,
      },
    });

    const cosInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
    });

    const cosUpload = new CosUpload({
      cos: {
        SecretId: secretId,
        SecretKey: secretKey,
        XCosSecurityToken: token,
      },
      maxTryTimes: 1,
      putObjectLimit: 5 * 1024 * 1024 * 1024,
      defaultHashCheck,
    });

    if (/manifest\.json$/.test(key)) {
      runningTask = new ScfInvokeTask({
        secretId,
        secretKey,
        token,
        cosInstance,
        cosUpload,
        bucket,
        region,
        key,
        targetBucket,
        targetRegion,
        targetPrefix,
        extraRootDir,
        defaultHashCheck,
        context,
      });
    } else {
      runningTask = new CosGunzipFileTask({
        cosInstance,
        cosUpload,
        bucket,
        region,
        key,
        targetBucket,
        targetRegion,
        targetPrefix,
        extraRootDir,
        defaultHashCheck,
      });
    }

    const taskResults = await runningTask.runTask();

    watcher.clear();

    const { status, messages } = getLogSummary({
      name: 'cos gunzip file',
      results: taskResults,
    });

    logger({
      messages: messages.map(item => item.replace(/, /g, '\n')),
    });

    let result = taskResults[0] || {};
    if (status !== 'success') {
      result = taskResults.find(item => Boolean(item.error)) || {};
      throw result.error
        ? result.error.error || result.error.message || result.error
        : {};
    }

    return {
      code: 0,
      message: 'cos gunzip file success',
      data: {
        Bucket: targetBucket,
        Region: targetRegion,
      },
    };
  } catch (err) {
    const error = err.stack ? { message: err.message } : err;
    const response = {
      code: -1,
      message: 'cos gunzip file fail',
      error,
    };
    if (process.env.SCF_ASYNC_RUN_ENABLE !== '0') {
      throw response;
    }
    return response;
  } finally {
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
