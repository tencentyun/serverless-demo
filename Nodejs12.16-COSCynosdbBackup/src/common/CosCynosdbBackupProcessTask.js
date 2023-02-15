/* eslint-disable no-param-reassign */
const { parseUrl, getMetaFromUrl, getRangeStreamFromUrl } = require('./utils');

class CosCynosdbBackupProcessTask {
  constructor({
    cosSdkInstance,
    cynosdbSdkInstance,
    cosUpload,
    targetBucket,
    targetRegion,
    targetPrefix,
    instanceList,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      cynosdbSdkInstance,
      cosUpload,
      targetBucket,
      targetRegion,
      targetPrefix,
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
            action: 'CosCynosdbBackupProcessTask.checkFileSame',
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
  async getSourceUrl({ Region, ClusterId, BackupId, BinlogId }) {
    const marker = `${Region}_${ClusterId}_${BackupId}_${BinlogId}`;
    const { url, expireTimeStamp } = this.sourceUrlCacheMap[marker] || {};
    if (url && Date.now() < expireTimeStamp) {
      return url;
    }
    let downloadUrl = '';
    if (BackupId) {
      const { DownloadUrl } = await this.cynosdbSdkInstance.requestRetry({
        action: 'DescribeBackupDownloadUrl',
        params: {
          Region,
          ClusterId,
          BackupId,
        },
      });
      downloadUrl = DownloadUrl;
    } else if (BinlogId) {
      const { DownloadUrl } = await this.cynosdbSdkInstance.requestRetry({
        action: 'DescribeBinlogDownloadUrl',
        params: {
          Region,
          ClusterId,
          BinlogId,
        },
      });
      downloadUrl = DownloadUrl;
    }
    this.sourceUrlCacheMap[marker] = {
      url: downloadUrl,
      expireTimeStamp: Date.now() + 10 * 60 * 60 * 1000,
    };
    return downloadUrl;
  }
  async getTargetUrl({ Region, ClusterId, BackupId, BinlogId }) {
    const sourceUrl = await this.getSourceUrl({
      Region,
      ClusterId,
      BackupId,
      BinlogId,
    });
    const { key } = parseUrl(sourceUrl);
    const targetKey = `${this.targetPrefix}${ClusterId}/${key}`;
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
        action: 'CosCynosdbBackupProcessTask.checkFileSame',
        params: {
          sourceUrl: sourceUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
          targetUrl: targetUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
        },
        error,
      };
    }
  }
}

module.exports = CosCynosdbBackupProcessTask;
