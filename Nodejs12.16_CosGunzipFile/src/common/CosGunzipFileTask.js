const path = require('path');
const CosSGunzipFileTask = require('./CosSGunzipFileTask');
const CosTGunzipFileTask = require('./CosTGunzipFileTask');

class CosGunzipFileTask {
  constructor({
    cosInstance,
    cosUpload,
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
  }) {
    const params = {
      bucket,
      region,
      key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
    };
    Object.assign(this, {
      cosInstance,
      cosUpload,
      params,
      runningTask: null,
    });
  }
  async runTask() {
    let fileType;
    try {
      fileType = await this.checkFileType();
    } catch (error) {
      return [
        {
          params: this.params,
          error: {
            trace: 'CosGunzipFileTask.checkFileType',
            error,
          },
        },
      ];
    }
    const params = {
      cosInstance: this.cosInstance,
      cosUpload: this.cosUpload,
      ...this.params,
    };
    if (fileType === '.gz') {
      this.runningTask = new CosSGunzipFileTask(params);
      const result = await this.runningTask.runTask();
      return result;
    }
    this.runningTask = new CosTGunzipFileTask(params);
    const result = await this.runningTask.runTask();
    return result;
  }
  async checkFileType() {
    const { key } = this.params;
    const extname = path.extname(key);
    if (extname !== '.gz' && extname !== '.tgz') {
      throw new Error(`checkFileType error, key(${key}) is not a *.gz or *.tgz file`);
    }
    if (/\.tar\.gz$/.test(key)) {
      return '.tgz';
    }
    return extname;
  }
  cancelTask(error = new Error('task is canceled')) {
    if (this.runningTask) {
      this.runningTask.cancelTask(error);
    }
  }
}

module.exports = CosGunzipFileTask;
