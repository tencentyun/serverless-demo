const {
  scf: {
    v20180416: { Client: ScfClient },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class ScfSdk {
  constructor({ secretId, secretKey, token }) {
    this.credential = {
      secretId,
      secretKey,
      token,
    };
    this.requestRetry = retry({
      func: (...args) => this.request(...args),
    });
  }
  request({ action, params = {} }) {
    return new Promise((resolve, reject) => {
      const { Region, ...args } = params;
      const client = new ScfClient({
        credential: this.credential,
        region: Region,
      });
      client.request(action, args, (err, response) => {
        if (err) {
          return reject(err);
        }
        resolve(response);
      });
    });
  }
}

module.exports = ScfSdk;
