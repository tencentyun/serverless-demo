/* eslint-disable no-param-reassign */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosHashCalculateTask = require('./common/CosHashCalculateTask');
const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
  /**
   * set a timer to terminate the hash calculate task, ensure log message is printed
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
  const {
    secretId,
    secretKey,
    token,
    objects,
    hashTypeList,
    caseType,
    triggerType,
  } = getParams(event);

  logger({
    title: 'param is parsed success',
  });

  const taskResults = [];

  const task = new CosHashCalculateTask({
    secretId,
    secretKey,
    token,
    objects,
    hashTypeList,
    caseType,
    triggerType,
  });

  if (watcher.isTimeout()) {
    // if current is timeout, trigger the cancel task in next tick
    process.nextTick(() => task.cancelTask(watcher.error));
  } else {
    runningTask = task;
  }
  const results = await task.runTask();
  taskResults.push(...results);

  watcher.clear();

  logger({
    title: 'cos hash calculate full logs:',
    data: taskResults,
  });

  const { status, messages } = getLogSummary({
    name: 'cos hash calculate',
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
