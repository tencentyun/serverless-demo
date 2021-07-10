/* eslint-disable no-param-reassign */
const path = require('path');
const Async = require('async');
const UnzipFile = require('./UnzipFile');
const {
  parseFileName,
  getUUID,
  getRange,
  appendRetryPromisify,
} = require('./utils');

const GB = 1024 * 1024 * 1024;
const PUT_OBJECT_LIMIT = 5 * GB;

class UnzipTask {
  constructor({
    cosInstance,
    Bucket,
    Region,
    Key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    pathTraversalProtection,
    recursive,
    rangeLimit,
    currentRange,
  }) {
    const { dirname, basename, extname } = parseFileName(Key);
    Object.assign(this, {
      cosInstance,
      Bucket,
      Region,
      Key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      pathTraversalProtection,
      recursive,
      rangeLimit,
      currentRange,
      dirname,
      basename,
      extname,
      runningRange: [],
      nextRange: null,
      runningTask: {},
      cancelError: null,
    });
    appendRetryPromisify({
      target: this,
      keys: ['runOneTask'],
      promisify: false,
      maxTryTime: 3,
    });
  }
  runTask() {
    return new Promise(async (resolve) => {
      const { Bucket, Region, Key, extname, recursive } = this;
      try {
        if (extname !== '.zip') {
          throw new Error(`${Key} is not a *.zip file`);
        }
        if (!recursive) {
          try {
            const {
              headers = {},
            } = await this.cosInstance.headObjectRetryPromise({
              Bucket,
              Region,
              Key,
            });
            if (
              headers
              && headers['x-cos-meta-scf-unzip']
              && headers['x-cos-meta-scf-unzip'] === 'true'
            ) {
              console.log(`comment: ${Key} is an unzip result, to avoid recursive unzip, skip it`);
              resolve({
                runningRange: [],
                results: [
                  {
                    params: {
                      Bucket,
                      Region,
                      Key,
                    },
                    error: null,
                    result: {
                      headers,
                      comment: `${Key} is an unzip result, to avoid recursive unzip, skip it`,
                    },
                  },
                ],
              });
              return;
            }
          } catch (err) {}
        }

        const { tasks, length } = await this.getTasks({
          start:
            this.currentRange && this.currentRange[0]
              ? this.currentRange[0]
              : 0,
          end:
            this.currentRange && this.currentRange[1]
              ? this.currentRange[1]
              : this.rangeLimit - 1,
        });
        this.runningRange =          this.currentRange
          || getRange({
            start: 0,
            step: this.rangeLimit,
            max: length - 1,
          });
        if (this.runningRange[1] < length - 1) {
          this.nextRange = getRange({
            start: this.runningRange[1] + 1,
            step: this.rangeLimit,
            max: length - 1,
          });
        }
        Async.mapLimit(
          tasks,
          6,
          async (task) => {
            const params = {
              index: task.index,
              fileNameStr: task.entry.fileNameStr,
              uncompressedSize: task.entry.uncompressedSize,
            };
            let result;
            let error;
            try {
              result = await this.runOneTaskRetry(task);
            } catch (err) {
              error = err;
            } finally {
              Object.keys(task).forEach((key) => {
                task[key] = null;
              });
            }
            return {
              params,
              result,
              error,
            };
          },
          (err, results) => resolve({
            runningRange: this.runningRange,
            nextRange: this.nextRange,
            results,
          }),
        );
      } catch (error) {
        resolve({
          runningRange: [],
          results: [
            {
              params: { Key },
              error: this.cancelError || error,
              result: null,
            },
          ],
        });
      }
    });
  }
  async getTasks({ start, end }) {
    try {
      const { cosInstance, Bucket, Region, Key } = this;
      this.unzipFile = new UnzipFile({
        cosInstance,
        Bucket,
        Region,
        Key,
      });
      await this.unzipFile.init();
      const { entries, length } = await this.unzipFile.getEntries({
        start,
        end,
      });
      console.log(`zip file entries count is ${length}`);
      return {
        tasks: entries,
        length,
      };
    } catch (error) {
      if (error && error.message === 'file size is 0') {
        return [];
      }
      throw {
        error,
        trace: 'UnzipTask.getTasks.unzipFile.getEntries',
      };
    }
  }
  async runOneTask(task) {
    const uuid = getUUID();
    this.runningTask[uuid] = task;

    let result;
    let error;
    try {
      const {
        cosInstance,
        targetBucket,
        targetRegion,
        targetPrefix,
        extraRootDir,
        pathTraversalProtection,
        dirname,
        basename,
        unzipFile,
      } = this;

      if (task.entry.uncompressedSize > PUT_OBJECT_LIMIT) {
        throw new Error(`single sub file can not larger than ${PUT_OBJECT_LIMIT / GB} GB`);
      }
      if (this.cancelError) {
        throw this.cancelError;
      }

      const extraPaths = [
        extraRootDir.toLowerCase().includes('dirname') ? dirname : '',
        extraRootDir.toLowerCase().includes('basename') ? basename : '',
      ].filter(Boolean);

      const fileNameStr = pathTraversalProtection
        ? task.entry.fileNameStr.replace(/\.\.\//g, '')
        : task.entry.fileNameStr;

      const Key = path
        .join(targetPrefix, ...extraPaths, fileNameStr)
        .replace(/\\/g, '/');

      task.putObjectStream = await unzipFile.getStream(task.entry);

      const { RequestId, Location } = await cosInstance.putObjectPromise({
        Bucket: targetBucket,
        Region: targetRegion,
        Key,
        Body: task.putObjectStream,
        Headers: {
          'x-cos-meta-scf-unzip': 'true',
        },
      });
      result = {
        RequestId,
        Location,
      };
    } catch (err) {
      error = {
        error: err,
        trace: 'UnzipTask.runOneTask.unzipFile.getStream',
      };
    } finally {
      // clear references
      delete this.runningTask[uuid];
      delete task.putObjectStream;
    }
    if (error) {
      throw error;
    }
    return result;
  }
  async cancelTask(err = new Error('task is canceled')) {
    this.cancelError = err;
    const taskIds = Object.keys(this.runningTask);
    for (const taskId of taskIds) {
      try {
        const task = this.runningTask[taskId];
        delete this.runningTask[taskId];
        if (task.putObjectStream && task.putObjectStream.emit) {
          task.putObjectStream.emit('error', this.cancelError);
        }
      } catch (err) {}
    }
    this.unzipFile && this.unzipFile.close();
  }
}

module.exports = UnzipTask;
