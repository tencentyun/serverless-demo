/* eslint-disable no-param-reassign */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosCdnRefreshTask = require('./common/CosCdnRefreshTask');
const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
  /**
   * set a timer to terminate the cdn refresh task, ensure log message is printed
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

  logger({
    title: 'param as follow: ',
    data: { event },
  });

  /**
   * parse param from event and process.env
   */
  const { secretId, secretKey, token, objects, triggerType, cdnHosts } =    getParams(event);

  logger({
    title: 'param is parsed success',
  });

  const taskResults = [];

  const task = new CosCdnRefreshTask({
    secretId,
    secretKey,
    token,
    objects,
    triggerType,
    cdnHosts,
  });

  if (watcher.isTimeout()) {
    // if current is timeout, trigger the cancel task in next tick
    process.nextTick(() => task.cancelTask(watcher.error));
  } else {
    runningTask = task;
  }

  const results = await task.runTask();
  results.forEach(item => taskResults.push(item));

  watcher.clear();

  logger({
    title: 'cos cdn refresh full logs:',
    data: taskResults,
  });

  const { status, messages } = getLogSummary({
    name: 'cos cdn refresh',
    results: taskResults,
  });

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
