const Async = require('async');
const CosSdk = require('cos-nodejs-sdk-v5');
const CdnSdk = require('./CdnSdk');
const { URL } = require('url');
const { logger } = require('./utils');

class CosCdnRefreshTask {
  constructor({
    secretId,
    secretKey,
    token,
    objects,
    triggerType,
    cdnHosts,
    ...args
  }) {
    this.cosSdkInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
    });
    this.cdnSdkInstance = new CdnSdk({
      secretId,
      secretKey,
      token,
    });
    Object.assign(this, {
      ...args,
      objects,
      triggerType,
      cdnHosts,
      status: 'waiting',
      purgeLimit: 1000,
    });
  }
  runTask() {
    this.status = 'running';
    return new Promise(async (resolve) => {
      const tasks = this.getPurgeTasks();
      Async.mapLimit(
        tasks,
        1,
        async (item) => {
          const result = await this.runOneTask(item);
          return result;
        },
        (err, results) => resolve(results),
      );
    });
  }
  async runOneTask({ urls }) {
    let result;
    let error;
    try {
      if (this.status === 'canceled') {
        throw this.cancelError;
      }
      result = await this.purgeUrlsCache({
        urls,
      });
    } catch (err) {
      error = err;
    } finally {
    }
    return {
      params: {
        urls,
      },
      result,
      error,
    };
  }
  getPurgeTasks() {
    const allUrls = [];
    for (const host of this.cdnHosts) {
      const tempUrls = this.objects.map(({ bucket, region, key }) => {
        const objectUrl = this.cosSdkInstance.getObjectUrl({
          Bucket: bucket,
          Region: region,
          Key: key,
          Sign: false,
        });
        const objectPath = objectUrl.replace(/^(https|http):\/\/([^/]+)/, '');
        return `${
          /^(https|http):\/\//.test(host) ? '' : 'https://'
        }${host}${objectPath}`;
      });
      tempUrls.forEach(item => allUrls.push(item));
    }
    const tasks = [];
    while (allUrls.length) {
      tasks.push({
        urls: allUrls.splice(0, this.purgeLimit),
      });
    }
    return tasks;
  }
  async purgeUrlsCache({ urls }) {
    try {
      const result = await this.cdnSdkInstance.requestRetry({
        action: 'PurgeUrlsCacheAsync',
        params: {
          Urls: urls,
        },
      });
      return result;
    } catch (err) {
      const splitPurgeTasks = this.getSplitPurgeTasks({ urls });
      if (splitPurgeTasks.length > 1) {
        logger({
          title:
            'Purge multiple urls cache error, try to purge url cache by host',
          data: {
            params: {
              urls,
            },
            error: err,
          },
        });
        const promiseList = splitPurgeTasks.map(async (params) => {
          let result;
          let error;
          try {
            result = await this.purgeUrlsCache(params);
          } catch (err) {
            error = err;
          }
          return {
            params,
            result,
            error,
          };
        });
        const results = await Promise.all(promiseList);
        if (results.filter(item => item.error).length) {
          throw {
            results,
          };
        } else {
          return results;
        }
      } else {
        throw err;
      }
    }
  }
  getSplitPurgeTasks({ urls }) {
    const map = {};
    for (const url of urls) {
      const { host } = new URL(url);
      map[host] = map[host] || [];
      map[host].push(url);
    }
    return Object.values(map).map(items => ({ urls: items }));
  }
  async cancelTask(error = new Error('task is canceled')) {
    this.status = 'canceled';
    this.cancelError = error;
  }
}

module.exports = CosCdnRefreshTask;
