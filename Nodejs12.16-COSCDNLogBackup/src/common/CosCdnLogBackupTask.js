/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const CosSdk = require('cos-nodejs-sdk-v5');
const CdnSdk = require('./CdnSdk');
const CosMultiUploadTask = require('./CosMultiUploadTask');
const Async = require('async');
const moment = require('moment');
const { crc64StreamPromise } = require('./crc64/index');
const {
  getUUID,
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
} = require('./utils');

class CosCdnLogBackupTask {
  constructor({ secretId, secretKey, token, ...args }) {
    this.cdnSdkInstance = new CdnSdk({ secretId, secretKey, token });
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
        if (this.domainBackupUrls) {
          backupUrls = this.domainBackupUrls;
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
        domain: this.domain,
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
        domain: this.domain,
        sourceUrl: sourceUrl.replace(/\?[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
      },
      result,
      error,
    };
  }
  async getBackupUrls({ domain } = {}) {
    try {
      domain = domain || this.domain;
      const start = moment(this.triggerTime)
        .subtract(this.backTrackDays, 'days')
        .startOf('day');
      const end = moment(this.triggerTime).endOf('day');
      const backups = [];
      const params = {
        Domain: domain,
        StartTime: start.format('YYYY-MM-DD HH:mm:ss'),
        EndTime: end.format('YYYY-MM-DD HH:mm:ss'),
      };
      const Limit = 1000;
      let Offset = 0;
      while (true) {
        const {
          DomainLogs = [],
          TotalCount,
        } = await this.cdnSdkInstance.requestRetry({
          action: 'DescribeCdnDomainLogs',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        backups.push(...DomainLogs);
        if (parseInt(TotalCount, 10) === backups.length) {
          break;
        } else {
          Offset += Limit;
        }
      }
      // if (!backups.length) {
      //   throw {
      //     trace: 'CosCdnLogBackupTask.getBackupUrls',
      //     message: 'no available backup url',
      //   };
      // }
      const urls = backups.map(item => item.LogPath);
      return urls;
    } catch (error) {
      throw {
        params: {
          domain,
          action: 'DescribeCdnDomainLogs',
        },
        error,
      };
    }
  }
  /**
   * split each backup url with it's domain, ensure each task has only one backup url
   * for example, if there are 3 domains and each one has 3 backup urls, we will split it into 9 backup tasks
   */
  async runBackupUrlSplitTask({ domainList = [] } = {}) {
    const results = [];
    for (const domainItem of domainList) {
      try {
        const urls = await this.getBackupUrls(domainItem);
        for (const sourceUrl of urls) {
          try {
            const targetKey = this.getTargetKey({ sourceUrl, ...domainItem });
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
                backupUrlSplitDomain: {
                  ...domainItem,
                  domainBackupUrls: [sourceUrl],
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
  getTargetKey({ sourceUrl, domain }) {
    const { key } = parseUrl(sourceUrl);
    return `${this.targetPrefix}${domain}/${key}`;
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
          trace: 'CosCdnLogBackupTask.checkFileSame',
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

module.exports = CosCdnLogBackupTask;
