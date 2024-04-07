const {
  cdb: {
    v20170320: { Client: CdbClient },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class CdbSdk {
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
    return new Promise(async (resolve, reject) => {
      const { Region, ...args } = params;
      const client = new CdbClient({
        credential: this.credential,
        region: Region,
      });
      try {
        await client.request(action, args, (err, response) => {
          if (err) {
            return reject(err);
          }
          resolve(response);
        });
      } catch (error) {}
    });
  }
}

module.exports = CdbSdk;
