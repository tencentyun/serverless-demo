/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const UnzipTask = require('./common/UnzipTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');
const TimeoutWatcher = require('./common/TimeoutWatcher');
const {
  getParams,
  initCosInstance,
  requestPromiseRetry,
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
    targetTriggerForbid,
    rangeLimit,
    currentRange,
    callbackUrl,
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
      targetTriggerForbid,
      rangeLimit,
      currentRange,
      callbackUrl,
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
    targetTriggerForbid,
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

  /**
   * request callback url
   */
  if (callbackUrl && !(status === 'success' && nextRange)) {
    try {
      const firstError = (taskResults.filter(item => item.error)[0] || {})
        .error;
      let error = firstError;
      if (error) {
        let depth = 0;
        while (error.error && depth < 10) {
          depth += 1;
          error = error.error;
        }
        if (error.stack) {
          error = {
            message: error.message,
          };
        }
      }
      await requestPromiseRetry({
        uri: callbackUrl,
        method: 'POST',
        json: {
          code: status === 'success' ? 0 : -1,
          message: `cos unzip file ${status}`,
          data: {
            functionName: context.function_name,
            functionRegion: context.tencentcloud_region,
            functionRequestId: context.request_id,
            bucket: Bucket,
            region: Region,
            key: Key,
          },
          ...(error ? { error } : {}),
        },
      });
    } catch (err) {
      logger({
        title: 'request callback url fail',
        data: err.message ? { message: err.message } : err,
      });
    }
  }

  watcher.clear();

  context.callbackWaitsForEmptyEventLoop = false;

  if (status === 'fail') {
    throw messages.join('; ');
  } else {
    return messages.join('; ');
  }
};
