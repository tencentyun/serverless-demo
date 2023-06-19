/* eslint-disable no-param-reassign */
const path = require('path');
const moment = require('moment');
const {
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
  replaceTemplate,
} = require('./utils');

class CosPostgresBackupProcessTask {
  constructor({
    cosSdkInstance,
    postgresSdkInstance,
    cosUpload,
    targetBucket,
    targetRegion,
    targetKeyTemplate,
    instanceList,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      postgresSdkInstance,
      cosUpload,
      targetBucket,
      targetRegion,
      targetKeyTemplate,
      instanceList,
      sourceUrlCacheMap: {},
    });
  }
  async runTask() {
    const results = [];
    for (const instance of this.instanceList) {
      const sourceUrl = await this.getSourceUrl(instance);
      const targetUrl = await this.getTargetUrl(instance);
      let isSame = false;
      try {
        isSame = await this.checkFileSame({ sourceUrl, targetUrl });
      } catch (err) {}
      let result = '';
      if (isSame) {
        result = 'same file skip';
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
            action: 'CosPostgresBackupProcessTask.checkFileSame',
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
      results.push({
        params: instance,
        result,
      });
    }
    return results;
  }
  async getSourceUrl({ Region, DBInstanceId, BackupType, BackupId }) {
    const marker = `${Region}_${DBInstanceId}_${BackupType}_${BackupId}`;
    const { url, expireTimeStamp } = this.sourceUrlCacheMap[marker] || {};
    if (url && Date.now() < expireTimeStamp) {
      return url;
    }
    const { BackupDownloadURL } = await this.postgresSdkInstance.requestRetry({
      action: 'DescribeBackupDownloadURL',
      params: {
        Region,
        DBInstanceId,
        BackupType,
        BackupId,
        URLExpireTime: 12,
      },
    });
    this.sourceUrlCacheMap[marker] = {
      url: BackupDownloadURL,
      expireTimeStamp: Date.now() + 10 * 60 * 60 * 1000,
    };
    return BackupDownloadURL;
  }
  async getTargetUrl({
    Region,
    DBInstanceId,
    BackupType,
    BackupId,
    StartTime,
    FinishTime,
  }) {
    const sourceUrl = await this.getSourceUrl({
      Region,
      DBInstanceId,
      BackupType,
      BackupId,
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
      '${DBInstanceId}': DBInstanceId,
      '${BackupType}': BackupType,
      '${BackupId}': BackupId,
      '${StartTime}': StartTime,
      '${StartTimeDate}': moment(StartTime).format('YYYY-MM-DD'),
      '${FinishTime}': FinishTime,
      '${FinishTimeDate}': moment(FinishTime).format('YYYY-MM-DD'),
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
        action: 'CosPostgresBackupProcessTask.checkFileSame',
        params: {
          sourceUrl: sourceUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
          targetUrl: targetUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
        },
        error,
      };
    }
  }
}

module.exports = CosPostgresBackupProcessTask;
