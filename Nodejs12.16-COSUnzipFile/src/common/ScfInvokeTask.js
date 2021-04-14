const ScfSdk = require('./ScfSdk');

class ScfInvokeTask {
  constructor({ secretId, secretKey, token, params, ...args }) {
    this.scfSdkInstance = new ScfSdk({ secretId, secretKey, token });
    Object.assign(this, {
      ...args,
      params,
      status: 'waiting',
      cancelError: null,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      if (this.status === 'canceled') {
        throw this.cancelError;
      }
      result = await this.scfSdkInstance.requestRetry({
        action: 'Invoke',
        params: this.params,
      });
    } catch (err) {
      error = err;
    }
    return [
      {
        params: this.params,
        result,
        error,
      },
    ];
  }
  async cancelTask(err = new Error('task is canceled')) {
    this.status = 'canceled';
    this.cancelError = err;
  }
}

module.exports = ScfInvokeTask;
