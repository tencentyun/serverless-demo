/* eslint-disable no-param-reassign */
const path = require('path');
const moment = require('moment');
const Async = require('async');
const {
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
  replaceTemplate,
  tryStringify,
} = require('./utils');

class CosTbaseBackupProcessTask {
  constructor({
    cosSdkInstance,
    tbaseSdkInstance,
    cosUpload,
    targetBucket,
    targetRegion,
    targetKeyTemplate,
    instanceList,
    mode = 'runTask',
    parallel = 1,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      tbaseSdkInstance,
      cosUpload,
      targetBucket,
      targetRegion,
      targetKeyTemplate,
      instanceList,
      mode,
      parallel,
      sourceUrlCacheMap: {},
    });
  }
  runTask() {
    return new Promise((resolve, reject) => {
      if (this.instanceList.length === 0) {
        resolve([]);
        return;
      }
      Async.mapLimit(
        this.instanceList,
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
  async runOneTask(instance) {
    const sourceUrl = await this.getSourceUrl(instance);
    const targetUrl = await this.getTargetUrl(instance);
    let isSame = false;
    try {
      isSame = await this.checkFileSame({ sourceUrl, targetUrl });
    } catch (err) {}
    let result = '';
    if (isSame) {
      if (this.mode === 'checkNeedRunTask') {
        result = 'DoNotNeedRunTask';
      } else {
        result = 'same file skip';
      }
    } else {
      if (this.mode === 'checkNeedRunTask') {
        result = 'NeedRunTask';
      } else {
        const sourceMeta = await getMetaFromUrl(sourceUrl);
        const targetKey = parseUrl(targetUrl).key;
        result = await this.cosUpload.runTask({
          object: {
            Bucket: this.targetBucket,
            Region: this.targetRegion,
            Key: targetKey,
            ContentLength: parseInt(sourceMeta['content-length'], 10),
          },
          getRangeReadStream: async (start, end) => {
            const url = await this.getSourceUrl(instance);
            return getRangeStreamFromUrl({
              url,
              start,
              end,
            });
          },
          getReadStream: async () => {
            const url = await this.getSourceUrl(instance);
            return getRangeStreamFromUrl({
              url,
            });
          },
        });
        isSame = await this.checkFileSame({
          sourceUrl: await this.getSourceUrl(instance),
          targetUrl: await this.getTargetUrl(instance),
        });
        if (!isSame) {
          throw {
            action: 'CosTbaseBackupProcessTask.checkFileSame',
            params: {
              sourceUrl: sourceUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
              targetUrl: targetUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
            },
            error: {
              message: 'x-cos-hash-crc64ecma check file same fail',
            },
          };
        }
      }
    }
    return result;
  }
  async getSourceUrl({
    Region,
    InstanceId,
    BackupId,
    FileDir,
    FileName,
    PublicNetworkDownloadEnable = true,
    IsWALBackup = false,
    Url: OriginUrl,
  }) {
    const marker = `${Region}_${InstanceId}_${BackupId}_${
      FileDir || ''
    }_${FileName}`;
    const { url, expireTimeStamp } = this.sourceUrlCacheMap[marker] || {};
    if (url && Date.now() < expireTimeStamp) {
      return url;
    }
    if (this.mode === 'checkNeedRunTask' && OriginUrl) {
      this.sourceUrlCacheMap[marker] = {
        url: OriginUrl,
        expireTimeStamp: Date.now() + 10 * 60 * 60 * 1000,
      };
      return OriginUrl;
    }
    const { Items = [] } = await this.tbaseSdkInstance.requestRetry({
      action: 'DescribeBackupDownloadLink',
      params: {
        Region,
        InstanceId,
        BackupId,
        FileName: FileDir || FileName,
        PublicNetworkDownloadEnable,
        IsWALBackup,
      },
    });
    const { Url } = Items.find(item => item.FileName === FileName) || {};
    this.sourceUrlCacheMap[marker] = {
      url: Url,
      expireTimeStamp: Date.now() + 10 * 60 * 60 * 1000,
    };
    return Url;
  }
  async getTargetUrl({
    Region,
    InstanceId,
    BackupId,
    FileDir,
    FileName,
    StartTime,
    EndTime,
    PublicNetworkDownloadEnable = true,
    IsWALBackup = false,
  }) {
    const sourceUrl = await this.getSourceUrl({
      Region,
      InstanceId,
      BackupId,
      FileDir,
      FileName,
      StartTime,
      EndTime,
      PublicNetworkDownloadEnable,
      IsWALBackup,
    });
    const { key } = parseUrl(sourceUrl);
    const targetKey = replaceTemplate(this.targetKeyTemplate, {
      '${Bucket}': this.targetBucket,
      '${Region}': this.targetRegion,
      '${Key}': key,
      '${InputPath}': key.replace(/[^/]+$/, ''),
      '${InputFullName}': path.basename(key),
      '${InputName}': path.basename(key, path.extname(key)),
      '${Ext}': path.extname(key),
      '${InstanceId}': InstanceId,
      '${BackupId}': BackupId,
      '${FileDir}': FileDir,
      '${FileName}': FileName,
      '${StartTime}': StartTime,
      '${StartTimeDate}': moment(StartTime).format('YYYY-MM-DD'),
      '${EndTime}': EndTime,
      '${EndTimeDate}': moment(EndTime).format('YYYY-MM-DD'),
    });
    return this.cosSdkInstance.getObjectUrl({
      Bucket: this.targetBucket,
      Region: this.targetRegion,
      Key: targetKey,
      Sign: true,
      Expires: 24 * 60 * 60,
    });
  }
  async checkFileSame({ sourceUrl, targetUrl }) {
    try {
      const sourceMeta = await getMetaFromUrl(sourceUrl);
      const targetMeta = await getMetaFromUrl(targetUrl);
      return (
        sourceMeta['x-cos-hash-crc64ecma']
        === targetMeta['x-cos-hash-crc64ecma']
      );
    } catch (error) {
      throw {
        action: 'CosTbaseBackupProcessTask.checkFileSame',
        params: {
          sourceUrl: sourceUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
          targetUrl: targetUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
        },
        error,
      };
    }
  }
}

module.exports = CosTbaseBackupProcessTask;
