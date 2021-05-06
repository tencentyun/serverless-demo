/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosCdnLogBackupTask = require('./common/CosCdnLogBackupTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');
const { getParams, logger, getLogSummary } = require('./common/utils');

exports.main_handler = async (event, context) => {
  /**
   * set a timer to terminate the cdn log backup task, ensure log message is printed
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
    domainList,
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
  let backupUrlSplitDomainList = [];
  const taskResults = [];

  /**
   * if function is trigger by timer, try to get available backup urls of each domain
   * split each backup url with it's domain, ensure each task has only one backup url
   * for example, if there are 3 domains and each one has 3 backup urls, we will split it into 9 backup tasks
   * it is in order to avoid running timeout
   */
  if (triggerType === 'Timer') {
    const cosCdnLogBackupTask = new CosCdnLogBackupTask({
      secretId,
      secretKey,
      token,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
      triggerTime,
    });
    const splitTaskResultList = await cosCdnLogBackupTask.runBackupUrlSplitTask({ domainList });
    const finishTaskResultList = splitTaskResultList.filter(item => !item.backupUrlSplitDomain);
    taskResults.push(...finishTaskResultList);
    backupUrlSplitDomainList = splitTaskResultList
      .map(item => item.backupUrlSplitDomain)
      .filter(Boolean);
  } else {
    backupUrlSplitDomainList = domainList;
  }

  if (triggerType === 'Timer' && backupUrlSplitDomainList.length > 1) {
    taskList = backupUrlSplitDomainList.map(domainItem => new ScfInvokeTask({
      secretId,
      secretKey,
      token,
      params: {
        Region: context.tencentcloud_region,
        FunctionName: context.function_name,
        InvocationType: 'Event',
        ClientContext: JSON.stringify({
          domainList: JSON.stringify([domainItem]),
          parentRequestId: context.request_id,
        }),
        Namespace: context.namespace,
      },
    }));
  } else {
    taskList = backupUrlSplitDomainList.map(({ domain, domainBackupUrls }) => new CosCdnLogBackupTask({
      secretId,
      secretKey,
      token,
      domain,
      domainBackupUrls,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
      triggerTime,
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
    title: 'cos cdn log backup full logs:',
    data: taskResults,
  });

  const { status, messages } = getLogSummary({
    name: 'cos cdn log backup',
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
