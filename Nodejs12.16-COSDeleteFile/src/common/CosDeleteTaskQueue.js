/* eslint-disable no-param-reassign */
/* eslint-disable prefer-const */
const FileDirTaskQueue = require('./FileDirTaskQueue');
const { getClassifyList } = require('./utils');

const COS_MULTIPLE_DELETE_LIMIT = 500;

class CosDeleteTaskQueue extends FileDirTaskQueue {
  constructor(
    { cosSdkInstance, interceptor, parallel = 100, maxFailLimit = -1, ...args },
    ...resArgs
  ) {
    super(
      {
        lastResult: {
          success: 0,
          fail: 0,
        },
        parallel,
        ...args,
      },
      ...resArgs,
    );
    Object.assign(this, {
      cosSdkInstance,
      interceptor,
      maxFailLimit,
      parallel,
      multipleDeleteQueue: [],
      multipleDeleteTimer: null,
      multipleDeleteDuration: 5000,
    });
  }
  async deleteFile({ bucket, region, key }) {
    let params = {
      Bucket: bucket,
      Region: region,
      Key: key,
    };
    if (this.interceptor) {
      const {
        params: newParams,
        result,
        error,
      } = await this.interceptor({
        event: 'beforeDelete',
        params,
      });
      if (error) {
        throw error;
      }
      if (result) {
        return result;
      }
      if (newParams) {
        params = newParams;
      }
    }
    const result = await this.runDelete(params);
    return result;
  }
  runDelete({ force = false, ...params }) {
    return new Promise(async (resolve, reject) => {
      if (!force) {
        this.multipleDeleteQueue.push({
          params,
          resolve,
          reject,
        });
        if (
          this.multipleDeleteQueue.length >= COS_MULTIPLE_DELETE_LIMIT
          || this.multipleDeleteQueue.length >= this.parallel
        ) {
          this.runDelete({ force: true });
        } else if (
          this.multipleDeleteTimer === undefined
          || this.multipleDeleteTimer === null
        ) {
          this.multipleDeleteTimer = setTimeout(
            () => this.runDelete({ force: true }),
            this.multipleDeleteDuration,
          );
        }
        return;
      }
      /**
       * clear multipleDeleteTimer
       */
      if (
        this.multipleDeleteTimer !== undefined
        && this.multipleDeleteTimer !== null
      ) {
        clearTimeout(this.multipleDeleteTimer);
        this.multipleDeleteTimer = null;
      }
      const list = this.multipleDeleteQueue;
      this.multipleDeleteQueue = [];
      if (list.length === 0) {
        return;
      }
      const groups = getClassifyList({
        list,
        getClassifyId: ({ params }) => `${params.Bucket}_${params.Region}`,
      });
      for (const group of groups) {
        let result = null;
        let error = null;
        let errorList = [];
        try {
          result = await this.cosSdkInstance.deleteMultipleObject({
            Bucket: group[0].params.Bucket,
            Region: group[0].params.Region,
            Objects: group.map(({ params }) => ({
              Key: params.Key,
            })),
            Quiet: true,
          });
          if (result.Error && result.Error.length) {
            errorList = result.Error;
            throw errorList;
          }
        } catch (err) {
          error = err;
        }
        group.forEach((item) => {
          let currentError = null;
          if (error) {
            if (errorList.length) {
              currentError = errorList.find(({ Key }) => item.params.Key === Key);
            } else {
              currentError = error;
            }
          }
          if (currentError) {
            item.reject(currentError);
          } else {
            item.resolve(result);
          }
        });
      }
    });
  }
  async _processFileTask({ params }) {
    const result = await this.deleteFile(params);
    return result;
  }
  async _processFileResult({ lastResult, currentTask }) {
    const { status } = currentTask || {};
    if (status === 'success') {
      lastResult.success += 1;
    } else {
      lastResult.fail += 1;
    }
    if (this.maxFailLimit > -1 && lastResult.fail > this.maxFailLimit) {
      process.nextTick(() => this.cancelTasks(new Error(`fail count is larger than maxFailLimit(${this.maxFailLimit})`)));
    }
    return lastResult;
  }
}

module.exports = CosDeleteTaskQueue;
