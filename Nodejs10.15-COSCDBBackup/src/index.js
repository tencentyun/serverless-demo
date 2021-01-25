/* eslint-disable no-restricted-syntax */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosCdbBackupTask = require('./common/CosCdbBackupTask');
const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
  /**
   * set a timer to terminate the cdb backup task, ensure log message is printed
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
   * parse param from event and process.env
   */
  const {
    secretId,
    secretKey,
    token,
    instanceList,
    targetBucket,
    targetRegion,
    targetPrefix,
    backTrackDays,
    triggerTime,
  } = getParams(event);

  logger({
    title: 'param is parsed success, param as follow: ',
    data: { event },
  });

  const taskList = instanceList.map(({ instanceId, instanceRegion }) => new CosCdbBackupTask({
    secretId,
    secretKey,
    token,
    instanceId,
    instanceRegion,
    targetBucket,
    targetRegion,
    targetPrefix,
    backTrackDays,
    triggerTime,
  }));

  const taskResults = [];
  for (const task of taskList) {
    if (watcher.isTimeout()) {
      // if current is timeout, trigger the cancel task in next tick
      process.nextTick(() => task.cancelTask(watcher.error));
    } else {
      runningTask = task;
    }
    const results = await task.runTask();
    taskResults.push(...results);
  }

  watcher.clear();

  logger({
    title: 'cos cdb backup full logs:',
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
