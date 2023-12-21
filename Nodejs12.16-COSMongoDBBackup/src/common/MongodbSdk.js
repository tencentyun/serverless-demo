const {
  mongodb: {
    v20190725: { Client },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class MongodbSdk {
  constructor(credential) {
    this.credential = credential;
    this.requestRetry = retry({
      func: (...args) => this.request(...args),
    });
  }
  request({ action, params = {} }) {
    const { Region, ...reqParams } = params;
    const profile = {};
    if (process.env.requestMode === 'internal') {
      Object.assign(profile, {
        httpProfile: {
          endpoint: 'mongodb.internal.tencentcloudapi.com',
        },
      });
    }
    const client = new Client({
      credential: this.credential,
      region: Region,
      profile,
    });
    return new Promise((resolve, reject) => {
      client[action](reqParams, (err, response) => {
        if (err) {
          err.action = action;
          return reject(err);
        }
        resolve(response);
      });
    });
  }
  async requestAllPageRetry({ action, resourceKey, limit = 100, params = {} }) {
    const list = [];
    const Limit = limit;
    let Offset = 0;
    while (true) {
      const { [resourceKey]: parts, TotalCount } = await this.requestRetry({
        action,
        params: {
          ...params,
          Offset,
          Limit,
        },
      });
      list.push(...parts);
      if (parseInt(TotalCount, 10) === list.length) {
        break;
      } else if (parts.length === 0) {
        // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
        break;
      } else {
        Offset += Limit;
      }
    }
    return list;
  }
}

module.exports = MongodbSdk;
