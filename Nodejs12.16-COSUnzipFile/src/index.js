/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const UnzipTask = require('./common/UnzipTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');
const TimeoutWatcher = require('./common/TimeoutWatcher');
const {
  getParams,
  initCosInstance,
  logger,
  getLogSummary,
} = require('./common/utils');

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
   * parse param from event and process.env
   */
  const {
    Bucket,
    Region,
    Key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    pathTraversalProtection,
    rangeLimit,
    currentRange,
    SecretId,
    SecretKey,
    XCosSecurityToken,
  } = getParams(event);
  logger({
    title: 'param is parsed success, param as follow:',
    data: {
      Bucket,
      Region,
      Key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      pathTraversalProtection,
      rangeLimit,
      currentRange,
      event,
      context: {
        memory_limit_in_mb: context.memory_limit_in_mb,
        time_limit_in_ms: context.time_limit_in_ms,
      },
    },
  });
  /**
   * init the cosInstance
   */
  const cosInstance = initCosInstance({
    SecretId,
    SecretKey,
    XCosSecurityToken,
  });
  /**
   * get unzip tasks
   */
  runningTask = new UnzipTask({
    cosInstance,
    Bucket,
    Region,
    Key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    pathTraversalProtection,
    rangeLimit,
    currentRange,
  });

  /**
   * run unzip task
   */
  const taskResults = [];
  const { results, runningRange, nextRange } = await runningTask.runTask();

  results.forEach(item => taskResults.push(item));

  const { status, messages } = getLogSummary({
    name: `cos unzip file(sub file number: ${
      runningRange && runningRange[0] + 1 && runningRange[1] + 1
        ? runningRange[0] + 1
        : 0
    } ~ ${runningRange && runningRange[1] + 1 ? runningRange[1] + 1 : 0})`,
    results: taskResults,
  });

  logger({
    messages: messages.map(item => item.replace(/, /g, '\n')),
  });

  if (status === 'success' && nextRange) {
    runningTask = new ScfInvokeTask({
      secretId: SecretId,
      secretKey: SecretKey,
      token: XCosSecurityToken,
      params: {
        Region: context.tencentcloud_region,
        FunctionName: context.function_name,
        InvocationType: 'Event',
        ClientContext: JSON.stringify({
          parentRequestId: context.request_id,
          currentRange: nextRange,
          Records: [
            {
              cos: {
                cosObject: {
                  url: cosInstance.getObjectUrl({
                    Bucket,
                    Region,
                    Key,
                  }),
                },
              },
            },
          ],
        }),
        Namespace: context.namespace,
      },
    });
    const invokeResults = await runningTask.runTask();
    const { messages } = getLogSummary({
      name: 'cos invoke scf function',
      results: invokeResults,
    });
    logger({
      messages: messages.map(item => item.replace(/, /g, '\n')),
    });
  }

  watcher.clear();

  context.callbackWaitsForEmptyEventLoop = false;

  if (status === 'fail') {
    throw messages.join('; ');
  } else {
    return messages.join('; ');
  }
};
