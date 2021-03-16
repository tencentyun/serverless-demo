/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosSdk = require('cos-nodejs-sdk-v5');
const CosSelectTask = require('./common/CosSelectTask');

const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
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
    objects,
    targetBucket,
    targetRegion,
    targetPrefix,
    targetNameFormat,
    selectType,
    cosSelectConfig,
    localSizeLimit,
    sourceSizeLimit,
    secretId,
    secretKey,
    token,
  } = getParams(event);

  logger({
    title: 'params parsed success, params as follow: ',
    data: {
      objects,
      targetBucket,
      targetRegion,
      targetPrefix,
      targetNameFormat,
      selectType,
      cosSelectConfig,
      localSizeLimit,
      sourceSizeLimit,
      event,
    },
  });

  const cosInstance = new CosSdk({
    SecretId: secretId,
    SecretKey: secretKey,
    XCosSecurityToken: token,
  });

  const taskList = objects.map(({ bucket, region, key }) => new CosSelectTask({
    cosInstance,
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetPrefix,
    targetNameFormat,
    selectType,
    cosSelectConfig,
    localSizeLimit,
    sourceSizeLimit,
  }));

  const taskResults = [];
  for (const task of taskList) {
    if (watcher.isTimeout()) {
      // if current is timeout, trigger the cancel task in next tick
      process.nextTick(() => task.cancelTask(watcher.error));
    } else {
      runningTask = task;
    }
    const result = await task.runTask();
    taskResults.push(result);
  }

  watcher.clear();

  logger({
    title: 'cos select full logs:',
    data: taskResults,
  });

  const { status, messages } = getLogSummary(taskResults);

  logger({
    messages: messages.map(item => item.replace(/, /g, '\n')),
  });

  context.callbackWaitsForEmptyEventLoop = false;

  if (status === 'fail') {
    throw messages.join('; ');
  } else {
    return messages.join('; ');
  }
};
