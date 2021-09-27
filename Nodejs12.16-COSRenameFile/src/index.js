/* eslint-disable no-param-reassign */
'use strict';

const TimeoutWatcher = require('./common/TimeoutWatcher');
const CosRenameFileTask = require('./common/CosRenameFileTask');
const {
  getParams,
  requestPromiseRetry,
  logger,
  getLogSummary,
} = require('./common/utils');

exports.main_handler = async (event, context) => {
  /**
   * set a timer to terminate the rename file task, ensure log message is printed
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
    triggerType,
    targetKeyTemplate,
    deleteSourceKey,
    defaultTimezone,
    callbackUrl,
  } = getParams(event);

  logger({
    title: 'param is parsed success',
  });

  const taskResults = [];

  const task = new CosRenameFileTask({
    secretId,
    secretKey,
    token,
    objects,
    triggerType,
    targetKeyTemplate,
    deleteSourceKey,
    defaultTimezone,
    callbackUrl,
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
    title: 'cos rename file full logs:',
    data: taskResults,
  });

  const { status, messages } = getLogSummary({
    name: 'cos rename file',
    results: taskResults,
  });

  logger({
    messages: messages.map(item => item.replace(/, /g, '\n')),
  });

  /**
   * request callback url
   */
  if (callbackUrl) {
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
      const taskResult = taskResults[0] || {};
      if (
        !(
          taskResult.result
          && taskResult.result.includes
          && taskResult.result.includes('skip')
        )
      ) {
        await requestPromiseRetry({
          uri: callbackUrl,
          method: 'POST',
          json: {
            code: status === 'success' ? 0 : -1,
            message: `cos rename file ${status}`,
            data: {
              functionName: context.function_name,
              functionRegion: context.tencentcloud_region,
              functionRequestId: context.request_id,
              source: taskResult.params,
              target: taskResult.error ? null : taskResult.result,
            },
            ...(error ? { error } : {}),
          },
        });
      }
    } catch (err) {
      logger({
        title: 'request callback url fail',
        data: err.message ? { message: err.message } : err,
      });
      throw err;
    }
  }

  context.callbackWaitsForEmptyEventLoop = false;

  if (status === 'fail') {
    throw messages.join('; ');
  } else {
    return messages.join('; ');
  }
};
