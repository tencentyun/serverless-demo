const {
  postgres: {
    v20170312: { Client: PostgresClient },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class PostgresSdk {
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
      const client = new PostgresClient({
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

module.exports = PostgresSdk;
