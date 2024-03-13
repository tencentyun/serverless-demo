const {
  postgres: {
    v20170312: { Client: PostgresClient },
  },
} = require('tencentcloud-sdk-nodejs');

const { retry } = require('./utils');

class TbaseSdk {
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
      const client = new PostgresClient({
        credential: this.credential,
        region: Region,
      });
      /**
       * 云 API 的 SDK 尚未支持 tbase 的 client
       * 通过 postgres 的 client 进行改造，更新 endpoint 和 apiVersion
       */
      Object.assign(client, {
        apiVersion: '2019-09-19',
        endpoint: 'tbase.tencentcloudapi.com',
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

module.exports = TbaseSdk;
