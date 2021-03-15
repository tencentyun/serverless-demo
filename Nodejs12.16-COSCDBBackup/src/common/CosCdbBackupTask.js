/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const CosSdk = require('cos-nodejs-sdk-v5');
const CdbSdk = require('./CdbSdk');
const CosMultiUploadTask = require('./CosMultiUploadTask');
const Async = require('async');
const moment = require('moment');
const { crc64StreamPromise } = require('./crc64/index');
const {
  getUUID,
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
  withinTargetDayRange,
} = require('./utils');

class CosCdbBackupTask {
  constructor({ secretId, secretKey, token, ...args }) {
    this.cdbSdkInstance = new CdbSdk({ secretId, secretKey, token });
    this.cosSdkInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
    });
    Object.assign(this, {
      ...args,
      status: 'waiting',
      cancelError: null,
      runningUploadTask: {},
      backupUrlExpireTime: 10 * 60 * 60 * 1000,
    });
  }
  runTask() {
    this.status = 'running';
    return new Promise(async (resolve) => {
      let backupUrls = [];
      try {
        if (this.instanceBackupUrls) {
          backupUrls = this.instanceBackupUrls;
        } else {
          backupUrls = await this.getBackupUrls();
        }
      } catch (err) {
        resolve([err]);
        return;
      }
      Async.mapLimit(
        backupUrls,
        1,
        async (sourceUrl) => {
          const result = await this.runOneTask(sourceUrl);
          return result;
        },
        (err, results) => resolve(results),
      );
    });
  }
  async cancelTask(err = new Error('task is canceled')) {
    this.status = 'canceled';
    this.cancelError = err;
    const taskIds = Object.keys(this.runningUploadTask);
    for (const taskId of taskIds) {
      try {
        const task = this.runningUploadTask[taskId];
        delete this.runningUploadTask[taskId];
        await task.cancelTask(this.cancelError);
      } catch (err) {}
    }
  }
  async runOneTask(sourceUrl) {
    const taskId = getUUID();
    let result;
    let error;
    // update sourceUrl to prevent expiration
    const renewInterval = setInterval(async () => {
      try {
        sourceUrl = await this.renewBackupUrl(sourceUrl);
      } catch (err) {
        console.log(err);
      }
    }, this.backupUrlExpireTime);
    try {
      const targetKey = this.getTargetKey({
        sourceUrl,
        instanceId: this.instanceId,
      });
      const targetUrl = this.cosSdkInstance.getObjectUrl({
        Bucket: this.targetBucket,
        Region: this.targetRegion,
        Key: targetKey,
        Sign: true,
        Expires: 24 * 60 * 60,
      });
      const sourceMeta = await getMetaFromUrl(sourceUrl);
      const isSame = await this.checkFileSame({
        sourceUrl,
        targetUrl,
        sourceMeta,
        silent: true,
      });
      if (isSame) {
        result = {
          headers: sourceMeta,
          comment: 'same file skip',
        };
      } else {
        if (this.status === 'canceled') {
          throw this.cancelError;
        }
        const task = new CosMultiUploadTask({
          cosSdkInstance: this.cosSdkInstance,
          object: {
            Bucket: this.targetBucket,
            Region: this.targetRegion,
            Key: targetKey,
            ContentLength: sourceMeta['content-length'],
            Hash: sourceMeta['x-cos-hash-crc64ecma'],
          },
          getReadStream: (start, end) => getRangeStreamFromUrl({
            url: sourceUrl,
            start,
            end,
          }),
        });
        this.runningUploadTask[taskId] = task;
        result = await task.runTask();
        await this.checkFileSame({
          sourceUrl,
          targetUrl,
          sourceMeta,
          targetMeta: result.headers,
        });
      }
    } catch (err) {
      error = err;
    } finally {
      clearInterval(renewInterval);
      delete this.runningUploadTask[taskId];
    }
    return {
      params: {
        instanceRegion: this.instanceRegion,
        instanceId: this.instanceId,
        sourceUrl: sourceUrl.replace(/\?[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
      },
      result,
      error,
    };
  }
  async getBackupUrls({ instanceRegion, instanceId } = {}) {
    try {
      instanceRegion = instanceRegion || this.instanceRegion;
      instanceId = instanceId || this.instanceId;
      const backups = [];
      const params = {
        Region: instanceRegion,
        InstanceId: instanceId,
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const {
          Items = [],
          TotalCount,
        } = await this.cdbSdkInstance.requestRetry({
          action: 'DescribeBackups',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        backups.push(...Items);
        if (parseInt(TotalCount, 10) === backups.length) {
          break;
        } else {
          Offset += Limit;
        }
      }
      const availableBackups = backups.filter(item => item.Status === 'SUCCESS');
      availableBackups.sort((item1, item2) => moment(item2.Date).unix() - moment(item1.Date).unix());
      if (!availableBackups.length) {
        throw {
          trace: 'CosCdbBackupTask.getBackupUrls',
          message: 'no available backup url',
        };
      }
      const urls = availableBackups
        .filter(item => withinTargetDayRange({
          source: item.Date,
          target: availableBackups[0].Date,
          dayRange: this.backTrackDays,
        }))
        .map(item => item.IntranetUrl || item.InternetUrl);
      return urls;
    } catch (error) {
      throw {
        params: {
          instanceRegion,
          instanceId,
          action: 'DescribeBackups',
        },
        error,
      };
    }
  }
  /**
   * split each backup url with it's cdb instance, ensure each task has only one backup url
   * for example, if there are 3 cdb instances and each one has 3 backup urls, we will split it into 9 backup tasks
   */
  async runBackupUrlSplitTask({ instanceList = [] } = {}) {
    const results = [];
    for (const instance of instanceList) {
      try {
        const urls = await this.getBackupUrls(instance);
        for (const sourceUrl of urls) {
          try {
            const targetKey = this.getTargetKey({ sourceUrl, ...instance });
            const targetUrl = this.cosSdkInstance.getObjectUrl({
              Bucket: this.targetBucket,
              Region: this.targetRegion,
              Key: targetKey,
              Sign: true,
              Expires: 24 * 60 * 60,
            });
            const sourceMeta = await getMetaFromUrl(sourceUrl);
            const isSame = await this.checkFileSame({
              sourceUrl,
              targetUrl,
              sourceMeta,
              silent: true,
            });
            if (isSame) {
              results.push({
                params: {
                  sourceUrl: sourceUrl.replace(/\?[\s\S]*$/, ''),
                },
                result: {
                  headers: sourceMeta,
                  comment: 'same file skip',
                },
              });
            } else {
              results.push({
                backupUrlSplitInstance: {
                  ...instance,
                  instanceBackupUrls: [sourceUrl],
                },
              });
            }
          } catch (error) {
            results.push({
              params: {
                sourceUrl: sourceUrl.replace(/\?[\s\S]*$/, ''),
              },
              error,
            });
          }
        }
      } catch (error) {
        results.push(error);
      }
    }
    return results;
  }
  async renewBackupUrl(sourceUrl) {
    const unsignSourceUrl = sourceUrl.replace(/\?[\s\S]*$/, '');
    const backupUrls = await this.getBackupUrls();
    const renewUrl = backupUrls.filter(url => url.replace(/\?[\s\S]*$/, '') === unsignSourceUrl)[0];
    if (renewUrl) {
      return renewUrl;
    }
    throw new Error('get renew backup url error');
  }
  getTargetKey({ sourceUrl, instanceId }) {
    const { key } = parseUrl(sourceUrl);
    return `${this.targetPrefix}${instanceId}/${key}`;
  }
  async checkFileSame({
    sourceUrl,
    targetUrl,
    sourceMeta,
    targetMeta,
    silent = false,
  }) {
    try {
      if (!sourceMeta) {
        sourceMeta = await getMetaFromUrl(sourceUrl);
      }
      if (!targetMeta) {
        targetMeta = await getMetaFromUrl(targetUrl);
      }
      if (!sourceMeta['x-cos-hash-crc64ecma']) {
        const stream = getRangeStreamFromUrl({ url: sourceUrl });
        sourceMeta['x-cos-hash-crc64ecma'] = await crc64StreamPromise(stream);
      }
      if (!targetMeta['x-cos-hash-crc64ecma']) {
        const stream = getRangeStreamFromUrl({ url: targetUrl });
        targetMeta['x-cos-hash-crc64ecma'] = await crc64StreamPromise(stream);
      }
      if (
        sourceMeta['x-cos-hash-crc64ecma']
        !== targetMeta['x-cos-hash-crc64ecma']
      ) {
        throw {
          sourceUrl: sourceUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
          targetUrl: targetUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
          sourceMeta,
          targetMeta,
          trace: 'CosCdbBackupTask.checkFileSame',
          message: 'x-cos-hash-crc64ecma check file same fail',
        };
      }
    } catch (err) {
      if (silent) {
        return false;
      }
      throw err;
    }
    return true;
  }
}

module.exports = CosCdbBackupTask;
