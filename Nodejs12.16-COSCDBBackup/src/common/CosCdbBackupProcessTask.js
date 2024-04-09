/* eslint-disable no-param-reassign */
const path = require('path');
const moment = require('moment');
const Async = require('async');
const { URL } = require('url');
const {
  parseUrl,
  getMetaFromUrl,
  getRangeStreamFromUrl,
  replaceTemplate,
  tryStringify,
} = require('./utils');

class CosCdbBackupProcessTask {
  constructor({
    cosSdkInstance,
    cdbSdkInstance,
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
      cdbSdkInstance,
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
            action: 'CosCdbBackupProcessTask.checkFileSame',
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
    RequestAction = 'DescribeBackups',
    BackupId,
    StartTime,
    FinishTime,
    IntranetUrl: OriginIntranetUrl,
    InternetUrl: OriginInternetUrl,
  }) {
    const OriginUrl = OriginIntranetUrl || OriginInternetUrl;
    const marker = `${Region}_${InstanceId}_${BackupId}`;
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
    if (RequestAction === 'DescribeBinlogs') {
      const results = [];
      const params = {
        Region,
        InstanceId,
        MinStartTime: moment(StartTime)
          .subtract(1, 'minutes')
          .format('YYYY-MM-DD HH:mm:ss'),
        MaxStartTime: FinishTime,
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { Items = [], TotalCount } =          await this.cdbSdkInstance.requestRetry({
          action: 'DescribeBinlogs',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        results.push(...Items);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (Items.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          Offset += Limit;
        }
      }
      const { RealUrl } = results
        .map(item => ({
          ...item,
          RealUrl: item.IntranetUrl || item.InternetUrl,
        }))
        .find((item) => {
          const before = new URL(OriginUrl);
          const after = new URL(item.RealUrl);
          return (
            before.host === after.host && before.pathname === after.pathname
          );
        });
      this.sourceUrlCacheMap[marker] = {
        url: RealUrl,
        expireTimeStamp: Date.now() + 10 * 60 * 60 * 1000,
      };
      return RealUrl;
    }
    const results = [];
    const params = {
      Region,
      InstanceId,
      MinStartTime: moment(StartTime)
        .subtract(1, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss'),
      MaxStartTime: FinishTime,
    };
    const Limit = 100;
    let Offset = 0;
    while (true) {
      const { Items = [], TotalCount } = await this.cdbSdkInstance.requestRetry({
        action: 'DescribeBackups',
        params: {
          ...params,
          Offset,
          Limit,
        },
      });
      results.push(...Items);
      if (parseInt(TotalCount, 10) === results.length) {
        break;
      } else if (Items.length === 0) {
        // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
        break;
      } else {
        Offset += Limit;
      }
    }
    const { RealUrl } = results
      .map(item => ({
        ...item,
        RealUrl: item.IntranetUrl || item.InternetUrl,
      }))
      .find((item) => {
        const before = new URL(OriginUrl);
        const after = new URL(item.RealUrl);
        return before.host === after.host && before.pathname === after.pathname;
      });
    this.sourceUrlCacheMap[marker] = {
      url: RealUrl,
      expireTimeStamp: Date.now() + 10 * 60 * 60 * 1000,
    };
    return RealUrl;
  }
  async getTargetUrl({
    Region,
    InstanceId,
    BackupId,
    StartTime,
    FinishTime,
    ...args
  }) {
    const sourceUrl = await this.getSourceUrl({
      Region,
      InstanceId,
      BackupId,
      StartTime,
      FinishTime,
      ...args,
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
        action: 'CosCdbBackupProcessTask.checkFileSame',
        params: {
          sourceUrl: sourceUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
          targetUrl: targetUrl.replace(/(\?)[\s\S]*$/, ''), // remove querystring, avoid security problem when logging
        },
        error,
      };
    }
  }
}

module.exports = CosCdbBackupProcessTask;
