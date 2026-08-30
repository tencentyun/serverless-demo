const {
  scf: {
    v20180416: { Client },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class ScfSdk {
  constructor(credential) {
    this.credential = credential;
    this.requestRetry = retry({
      func: (...args) => this.request(...args),
    });
  }
  request({ action, params = {} }) {
    const { Region, ...reqParams } = params;
    const client = new Client({
      credential: this.credential,
      region: Region,
      profile: {},
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
      } else {
       
      // Offset += Limit;
         Offset += 1
      }
    }
    return list;
  }
}

module.exports = ScfSdk;
