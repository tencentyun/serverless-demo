const Async = require('async');
const ScfSdk = require('./ScfSdk');
const { sleep } = require('./utils');

class ScfInvokeTask {
  constructor({
    secretId,
    secretKey,
    token,
    cosInstance,
    bucket,
    region,
    key,
    context,
    ...args
  }) {
    this.scfSdkInstance = new ScfSdk({ secretId, secretKey, token });
    Object.assign(this, {
      ...args,
      cosInstance,
      bucket,
      region,
      key,
      context,
      status: 'waiting',
      cancelError: null,
    });
  }
  async runTask() {
    this.status = 'running';
    return new Promise(async (resolve) => {
      let urls = [];
      try {
        urls = await this.getUrls();
      } catch (err) {
        resolve([err]);
        return;
      }
      Async.mapLimit(
        urls,
        3,
        async (url) => {
          const result = await this.runOneTask(url);
          await sleep(2000);
          return result;
        },
        (err, results) => resolve(results),
      );
    });
  }
  async getUrls() {
    const params = {
      Bucket: this.bucket,
      Region: this.region,
      Key: this.key,
    };
    try {
      const { Body } = await this.cosInstance.getObject(params);
      const { files } = JSON.parse(Body);
      return files.map(({ key }) => `https://${this.bucket}.cos.${this.region}.myqcloud.com/${key}`);
    } catch (error) {
      throw {
        params,
        error,
      };
    }
  }
  async runOneTask(url) {
    const params = {
      Region: this.context.tencentcloud_region,
      FunctionName: this.context.function_name,
      InvocationType: 'Event',
      Namespace: this.context.namespace,
      ClientContext: JSON.stringify({
        Records: [
          {
            cos: {
              cosObject: {
                url,
              },
            },
          },
        ],
        parentRequestId: this.context.request_id,
      }),
    };
    let result;
    let error;
    try {
      if (this.status === 'canceled') {
        throw this.cancelError;
      }
      result = await this.scfSdkInstance.requestRetry({
        action: 'Invoke',
        params,
      });
    } catch (err) {
      error = err;
    }
    return {
      params,
      result,
      error,
    };
  }
  async cancelTask(err = new Error('task is canceled')) {
    this.status = 'canceled';
    this.cancelError = err;
  }
}

module.exports = ScfInvokeTask;
