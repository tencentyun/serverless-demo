/* eslint-disable no-param-reassign */
/* eslint-disable no-restricted-syntax */
'use strict';

const UnzipTask = require('./common/UnzipTask');
const ScfInvokeTask = require('./common/ScfInvokeTask');
const TimeoutWatcher = require('./common/TimeoutWatcher');
const { CosUpload } = require('@annexwu-packages/cos-upload-utils');
const {
  getParams,
  initCosInstance,
  requestPromiseRetry,
  tryStringify,
  logger,
  getLogSummary,
} = require('./common/utils');

exports.main_handler = async (event, context) => {
  try {
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
      defaultHashCheck,
      rangeLimit,
      entryCountLimit,
      currentRange,
      callbackUrl,
      SecretId,
      SecretKey,
      XCosSecurityToken,
    } = getParams(event, context);
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
        defaultHashCheck,
        rangeLimit,
        entryCountLimit,
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
     * init CosUpload instance
     */
    const cosUpload = new CosUpload({
      cos: {
        SecretId,
        SecretKey,
        XCosSecurityToken,
      },
      putObjectLimit: 5 * 1024 * 1024 * 1024,
      defaultHashCheck,
    });
    /**
     * get unzip tasks
     */
    runningTask = new UnzipTask({
      cosInstance,
      cosUpload,
      Bucket,
      Region,
      Key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      pathTraversalProtection,
      targetTriggerForbid,
      defaultHashCheck,
      rangeLimit,
      entryCountLimit,
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
        const hostName = new URL(callbackUrl).host.split(':')[0];
        const headers = {};
        if (
          !/^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(hostName)
        ) {
          Object.assign(headers, {
            Host: hostName,
          });
        }
        await requestPromiseRetry({
          uri: callbackUrl,
          method: 'POST',
          headers,
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

    let result = taskResults[0] || {};
    if (status !== 'success') {
      result = taskResults.find(item => Boolean(item.error)) || {};
      throw result.error
        ? result.error.error || result.error.message || result.error
        : {};
    }

    return {
      code: 0,
      message: 'cos unzip file success',
      data: {
        Bucket: targetBucket,
        Region: targetRegion,
      },
    };
  } catch (err) {
    const error = err.stack ? { message: err.message } : err;
    const response = {
      code: -1,
      message: 'cos unzip file fail',
      error,
    };
    if (process.env.SCF_ASYNC_RUN_ENABLE !== '0') {
      throw tryStringify(response);
    }
    return response;
  } finally {
    context.callbackWaitsForEmptyEventLoop = false;
  }
};
