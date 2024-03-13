const Async = require('async');
const { sleep, tryStringify } = require('./utils');

class ScfInvokeTask {
  constructor({ scfSdkInstance, paramsList, parallel = 10 }) {
    Object.assign(this, {
      scfSdkInstance,
      paramsList,
      parallel: Math.min(parallel, paramsList.length),
    });
  }
  runTask() {
    return new Promise((resolve, reject) => {
      if (this.paramsList.length === 0) {
        resolve([]);
        return;
      }
      Async.mapLimit(
        this.paramsList,
        this.parallel,
        async (params) => {
          try {
            const result = await this.runOneTask(params);
            return {
              params,
              result,
            };
          } catch (error) {
            throw tryStringify({
              params,
              error,
            });
          }
        },
        (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        },
      );
    });
  }
  async runOneTask(params) {
    const { Result: { FunctionRequestId } = {} } =      await this.scfSdkInstance.requestRetry({
      action: 'Invoke',
      params,
    });
    let currentPollingTimes = 0;
    const maxPollingTimes = (24 * 60 * 60) / 2;
    while (true) {
      currentPollingTimes += 1;
      const { EventList = [] } = await this.scfSdkInstance.requestRetry({
        action: 'ListAsyncEvents',
        params: {
          Region: params.Region,
          FunctionName: params.FunctionName,
          Namespace: params.Namespace,
          InvokeRequestId: FunctionRequestId,
        },
      });
      const event = EventList[0] || {};
      if (event.Status === 'RUNNING' || !event.Status) {
        if (currentPollingTimes >= maxPollingTimes) {
          throw {
            event,
          };
        }
      } else {
        if (event.Status === 'FINISHED') {
          return {
            event,
          };
        }
        throw {
          event,
        };
      }
      await sleep(2000);
    }
  }
}

module.exports = ScfInvokeTask;
