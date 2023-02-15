const {
  cynosdb: {
    v20190107: { Client: CynosdbClient },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class CynosdbSdk {
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
      const client = new CynosdbClient({
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

module.exports = CynosdbSdk;
