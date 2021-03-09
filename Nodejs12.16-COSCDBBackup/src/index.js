/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosCdbBackupTask = require('./common/CosCdbBackupTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');
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
    triggerType,
  } = getParams(event);

  logger({
    title: 'param is parsed success, param as follow: ',
    data: { event },
  });

  let taskList = [];
  let backupUrlSplitInstanceList = [];
  const taskResults = [];

  /**
   * if function is trigger by timer, try to get available backup urls of each cdb instance
   * split each backup url with it's cdb instance, ensure each task has only one backup url
   * for example, if there are 3 cdb instances and each one has 3 backup urls, we will split it into 9 backup tasks
   * it is in order to avoid running timeout
   */
  if (triggerType === 'Timer') {
    const cosCdbBackupTask = new CosCdbBackupTask({
      secretId,
      secretKey,
      token,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
    });
    const splitTaskResultList = await cosCdbBackupTask.runBackupUrlSplitTask({
      instanceList,
    });
    const finishTaskResultList = splitTaskResultList.filter(item => !item.backupUrlSplitInstance);
    taskResults.push(...finishTaskResultList);
    backupUrlSplitInstanceList = splitTaskResultList
      .map(item => item.backupUrlSplitInstance)
      .filter(Boolean);
  } else {
    backupUrlSplitInstanceList = instanceList;
  }

  if (triggerType === 'Timer' && backupUrlSplitInstanceList.length > 1) {
    taskList = backupUrlSplitInstanceList.map(instance => new ScfInvokeTask({
      secretId,
      secretKey,
      token,
      params: {
        Region: context.tencentcloud_region,
        FunctionName: context.function_name,
        InvocationType: 'Event',
        ClientContext: JSON.stringify({
          instanceList: JSON.stringify([instance]),
          parentRequestId: context.request_id,
        }),
        Namespace: context.namespace,
      },
    }));
  } else {
    taskList = backupUrlSplitInstanceList.map(({ instanceId, instanceRegion, instanceBackupUrls }) => new CosCdbBackupTask({
      secretId,
      secretKey,
      token,
      instanceId,
      instanceRegion,
      instanceBackupUrls,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
      triggerTime,
      triggerType,
    }));
  }

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
