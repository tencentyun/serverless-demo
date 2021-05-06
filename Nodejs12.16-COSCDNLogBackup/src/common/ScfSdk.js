const {
  scf: {
    v20180416: { Client: ScfClient, Models: ScfModels },
  },
  common: { Credential },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class ScfSdk {
  constructor({ secretId, secretKey, token }) {
    this.credential = new Credential(secretId, secretKey, token);
    this.requestRetry = retry({
      func: (...args) => this.request(...args),
    });
  }
  request({ action, params = {} }) {
    return new Promise((resolve, reject) => {
      const client = new ScfClient(this.credential);
      const req = new ScfModels[`${action}Request`]();
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

module.exports = ScfSdk;
