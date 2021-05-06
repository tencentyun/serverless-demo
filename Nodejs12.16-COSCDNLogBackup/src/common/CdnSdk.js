const {
  cdn: {
    v20180606: { Client: CdnClient, Models: CdnModels },
  },
  common: { Credential },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class CdnSdk {
  constructor({ secretId, secretKey, token }) {
    this.credential = new Credential(secretId, secretKey, token);
    this.requestRetry = retry({
      func: (...args) => this.request(...args),
    });
  }
  request({ action, params = {} }) {
    return new Promise((resolve, reject) => {
      const client = new CdnClient(this.credential);
      const req = new CdnModels[`${action}Request`]();
      Object.assign(req, params);
      client[action](req, (err, response) => {
        if (err) {
          return reject(err);
        }
        resolve(response);
      });
    });
  }
}

module.exports = CdnSdk;
