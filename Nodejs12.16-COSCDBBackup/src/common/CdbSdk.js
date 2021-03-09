const {
  cdb: {
    v20170320: { Client: CdbClient, Models: CdbModels },
  },
  common: { Credential },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class CdbSdk {
  constructor({ secretId, secretKey, token }) {
    this.credential = new Credential(secretId, secretKey, token);
    this.requestRetry = retry({
      func: (...args) => this.request(...args),
    });
  }
  request({ action, params = {} }) {
    return new Promise((resolve, reject) => {
      const client = new CdbClient(this.credential);
      const req = new CdbModels[`${action}Request`]();
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

module.exports = CdbSdk;
