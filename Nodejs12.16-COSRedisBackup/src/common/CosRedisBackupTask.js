/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const CosSdk = require('cos-nodejs-sdk-v5');
const RedisSdk = require('./RedisSdk');
const CosMultiUploadTask = require('./CosMultiUploadTask');
const Async = require('async');
const moment = require('moment');
const { crc64StreamPromise } = require('./crc64/index');
const {
  retry,
  getUUID,
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
} = require('./utils');

class CosRedisBackupTask {
  constructor({
    secretId,
    secretKey,
    token,
    triggerTime,
    backTrackDays,
    ...args
  }) {
    if (token) {
      this.redisSdkInstance = new RedisSdk({
        secretId,
        secretKey,
        token,
      });
    } else {
      this.redisSdkInstance = new RedisSdk({ secretId, secretKey });
    }
    this.cosSdkInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
    });
    this.renewBackupUrlRetry = retry({
      func: (...args) => this.renewBackupUrl(...args),
    });
    Object.assign(this, {
      ...args,
      triggerTime,
      backTrackDays,
      startTime: moment(triggerTime)
        .subtract(backTrackDays, 'days')
        .startOf('day')
        .format('YYYY-MM-DD HH:mm:ss'),
      endTime: moment(triggerTime).endOf('day')
        .format('YYYY-MM-DD HH:mm:ss'),
      status: 'waiting',
      cancelError: null,
      runningUploadTask: {},
      backupUrlExpireTime: 5 * 60 * 60 * 1000,
    });
  }
  runTask() {
    this.status = 'running';
    return new Promise(async (resolve) => {
      let backupUrls = [];
      try {
        backupUrls = this.instanceBackupUrls;
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
        sourceUrl = await this.renewBackupUrlRetry(sourceUrl);
      } catch (err) {
        console.log(err);
      }
    }, this.backupUrlExpireTime);
    try {
      sourceUrl = await this.renewBackupUrlRetry(sourceUrl);
      const targetKey = this.getTargetKey({ sourceUrl });
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
  async getBackups({ instanceRegion, instanceId } = {}) {
    const params = {
      Region: instanceRegion || this.instanceRegion,
      InstanceId: instanceId || this.instanceId,
      BeginTime: this.startTime,
      EndTime: this.endTime,
      Status: [2, 4],
    };
    try {
      const backups = await this.redisSdkInstance.requestAllPageRetry({
        action: 'DescribeInstanceBackups',
        resourceKey: 'BackupSet',
        limit: 20,
        params,
      });
      const list = [];
      for (const { BackupId, StartTime } of backups) {
        const { DownloadUrl = [] } = await this.redisSdkInstance.requestRetry({
          action: 'DescribeBackupUrl',
          params: {
            Region: instanceRegion || this.instanceRegion,
            InstanceId: instanceId || this.instanceId,
            BackupId,
          },
        });
        const parts = DownloadUrl.map(instanceBackupUrl => ({
          instanceRegion: instanceRegion || this.instanceRegion,
          instanceId: instanceId || this.instanceId,
          instanceStartTime: StartTime,
          instanceBackupId: BackupId,
          instanceBackupUrl,
        }));
        list.push(...parts);
      }
      return list;
    } catch (error) {
      throw {
        params,
        error,
      };
    }
  }
  /**
   * split each backup url with it's redis instance, ensure each task has only one backup url
   */
  async runBackupSplitTask({ instanceList = [] } = {}) {
    const results = [];
    for (const { instanceRegion, instanceId } of instanceList) {
      try {
        const backups = await this.getBackups({ instanceRegion, instanceId });
        for (const {
          instanceStartTime,
          instanceBackupId,
          instanceBackupUrl,
        } of backups) {
          const params = {
            instanceRegion,
            instanceId,
            instanceStartTime,
            instanceBackupId,
            instanceBackupUrls: [instanceBackupUrl],
          };
          const sourceUrl = instanceBackupUrl;
          const targetKey = this.getTargetKey({ sourceUrl, ...params });
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
              params,
              result: {
                comment: 'same file skip',
              },
            });
          } else {
            results.push({
              backupSplitInstance: params,
            });
          }
        }
      } catch (error) {
        results.push({
          params: {
            instanceRegion,
            instanceId,
          },
          error,
        });
      }
    }
    return results;
  }
  async renewBackupUrl(sourceUrl) {
    const unsignSourceUrl = sourceUrl.replace(/\?[\s\S]*$/, '');
    const backups = await this.getBackups();
    const backupUrls = backups.map(item => item.instanceBackupUrl);
    const renewUrl = backupUrls.filter(url => url.replace(/\?[\s\S]*$/, '') === unsignSourceUrl)[0];
    if (renewUrl) {
      await getMetaFromUrl(renewUrl);
      return renewUrl;
    }
    throw new Error('get renew backup url error');
  }
  getTargetKey({ sourceUrl, instanceId, instanceStartTime, instanceBackupId }) {
    const { key } = parseUrl(sourceUrl);
    return `${this.targetPrefix}${instanceId || this.instanceId}/${
      instanceStartTime || this.instanceStartTime
    }/${instanceBackupId || this.instanceBackupId}/${key.split('/').pop()}`;
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
          trace: 'CosRedisBackupTask.checkFileSame',
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

module.exports = CosRedisBackupTask;
