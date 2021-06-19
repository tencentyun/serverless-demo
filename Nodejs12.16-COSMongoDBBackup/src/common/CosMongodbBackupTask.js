/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const CosSdk = require('cos-nodejs-sdk-v5');
const MongodbSdk = require('./MongodbSdk');
const CosMultiUploadTask = require('./CosMultiUploadTask');
const Async = require('async');
const moment = require('moment');
const { crc64StreamPromise } = require('./crc64/index');
const {
  getUUID,
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
  sleep,
} = require('./utils');

class CosMongodbBackupTask {
  constructor({
    secretId,
    secretKey,
    token,
    triggerTime,
    backTrackDays,
    ...args
  }) {
    if (token) {
      this.mongodbSdkInstance = new MongodbSdk({ secretId, secretKey, token });
    } else {
      this.mongodbSdkInstance = new MongodbSdk({ secretId, secretKey });
    }
    this.cosSdkInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
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
      backupUrlExpireTime: 23 * 60 * 60 * 1000,
    });
  }
  runTask() {
    this.status = 'running';
    return new Promise(async (resolve) => {
      let backupUrls = [];
      try {
        backupUrls = await this.getBackupUrls();
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
  async getBackupUrls() {
    try {
      let tryTimes = 0;
      while (true) {
        tryTimes += 1;
        const downloadTasks = await this.mongodbSdkInstance.requestAllPageRetry({
          action: 'DescribeBackupDownloadTask',
          resourceKey: 'Tasks',
          limit: 100,
          params: {
            Region: this.instanceRegion,
            InstanceId: this.instanceId,
            BackupName: this.instanceBackupName,
          },
        });
        const downloadTask = downloadTasks.filter(item => item.ReplicaSetId === this.instanceReplicaSetId)[0];
        if (!downloadTask) {
          await this.mongodbSdkInstance.requestRetry({
            action: 'CreateBackupDownloadTask',
            params: {
              Region: this.instanceRegion,
              InstanceId: this.instanceId,
              BackupName: this.instanceBackupName,
              BackupSets: [
                {
                  ReplicaSetId: this.instanceReplicaSetId,
                },
              ],
            },
          });
        } else {
          if (downloadTask.Status === 2) {
            return [downloadTask.Url];
          }
          if (downloadTask.Status === 3 || tryTimes >= 3000) {
            throw {
              trace: 'CosMongodbBackupTask.getBackupUrls',
              message: `get download url fail, tryTimes: ${tryTimes}, detail: ${JSON.stringify(downloadTask)}`,
            };
          } else {
            await sleep(10 * 1000);
          }
        }
      }
    } catch (error) {
      throw {
        params: {
          instanceRegion: this.instanceRegion,
          instanceId: this.instanceId,
          instanceBackupName: this.instanceBackupName,
          instanceReplicaSetId: this.instanceReplicaSetId,
        },
        error,
      };
    }
  }
  /**
   * split each backup url with it's mongodb instance, ensure each task has only one BackupName and ReplicaSetId
   */
  async runBackupSplitTask({ instanceList = [] } = {}) {
    const results = [];
    for (const { instanceRegion, instanceId } of instanceList) {
      try {
        const {
          InstanceDetails = [],
        } = await this.mongodbSdkInstance.requestRetry({
          action: 'DescribeDBInstances',
          params: {
            Region: instanceRegion,
            InstanceIds: [instanceId],
            ClusterType: -1,
          },
        });
        if (!InstanceDetails || InstanceDetails.length === 0) {
          throw new Error(`${instanceId} is not exist when DescribeDBInstances`);
        }
        const { ReplicaSets = [] } = InstanceDetails[0];
        const backups = await this.mongodbSdkInstance.requestAllPageRetry({
          action: 'DescribeDBBackups',
          resourceKey: 'BackupList',
          limit: 100,
          params: {
            Region: instanceRegion,
            InstanceId: instanceId,
            BackupMethod: 2,
          },
        });
        const availableBackups = backups.filter(item => item.Status === 2
            && moment(this.startTime).unix() <= moment(item.StartTime).unix()
            && moment(item.StartTime).unix() <= moment(this.endTime).unix());
        for (const { BackupName } of availableBackups) {
          for (const { ReplicaSetId } of ReplicaSets) {
            const params = {
              instanceRegion,
              instanceId,
              instanceBackupName: BackupName,
              instanceReplicaSetId: ReplicaSetId,
            };
            try {
              const targetKey = this.getTargetKey({
                sourceKey: `${BackupName}/${ReplicaSetId}.tar`,
                instanceId,
              });
              const targetUrl = this.cosSdkInstance.getObjectUrl({
                Bucket: this.targetBucket,
                Region: this.targetRegion,
                Key: targetKey,
                Sign: true,
                Expires: 24 * 60 * 60,
              });
              await getMetaFromUrl(targetUrl);
              results.push({
                params,
                result: {
                  comment: 'same file skip',
                },
              });
            } catch (err) {
              results.push({
                backupSplitInstance: params,
              });
            }
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
    const backupUrls = await this.getBackupUrls();
    const renewUrl = backupUrls.filter(url => url.replace(/\?[\s\S]*$/, '') === unsignSourceUrl)[0];
    if (renewUrl) {
      return renewUrl;
    }
    throw new Error('get renew backup url error');
  }
  getTargetKey({ sourceUrl, sourceKey, instanceId }) {
    if (sourceUrl) {
      const { key } = parseUrl(sourceUrl);
      sourceKey = key;
    }
    return `${this.targetPrefix}${instanceId}/${sourceKey}`;
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
          trace: 'CosMongodbBackupTask.checkFileSame',
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

module.exports = CosMongodbBackupTask;
