/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosMongodbBackupTask = require('./common/CosMongodbBackupTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');
const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
  /**
   * set a timer to terminate the mongodb backup task, ensure log message is printed
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
  let backupSplitInstanceList = [];
  const taskResults = [];

  /**
   * if function is trigger by timer, try to get available backup urls of each mongodb instance
   * split each backup url with it's mongodb instance, ensure each task has only one backup url
   * for example, if there are 3 mongodb instances and each one has 3 backup urls, we will split it into 9 backup tasks
   * it is in order to avoid running timeout
   */
  if (triggerType === 'Timer') {
    const cosMongodbBackupTask = new CosMongodbBackupTask({
      secretId,
      secretKey,
      token,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
      triggerTime,
      triggerType,
    });
    const splitTaskResultList = await cosMongodbBackupTask.runBackupSplitTask({
      instanceList,
    });
    const finishTaskResultList = splitTaskResultList.filter(item => !item.backupSplitInstance);
    taskResults.push(...finishTaskResultList);
    backupSplitInstanceList = splitTaskResultList
      .map(item => item.backupSplitInstance)
      .filter(Boolean);
  } else {
    backupSplitInstanceList = instanceList;
  }

  if (triggerType === 'Timer' && backupSplitInstanceList.length > 1) {
    taskList = backupSplitInstanceList.map(instance => new ScfInvokeTask({
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
    taskList = backupSplitInstanceList.map(({
      instanceId,
      instanceRegion,
      instanceBackupName,
      instanceReplicaSetId,
    }) => new CosMongodbBackupTask({
      secretId,
      secretKey,
      token,
      instanceId,
      instanceRegion,
      instanceBackupName,
      instanceReplicaSetId,
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
    title: 'cos mongodb backup full logs:',
    data: taskResults,
  });

  const { status, messages } = getLogSummary({
    name: 'cos mongodb backup',
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
