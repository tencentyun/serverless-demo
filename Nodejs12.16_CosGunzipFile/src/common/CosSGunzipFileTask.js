const path = require('path');
const zlib = require('zlib');
const { PassThrough } = require('stream');
const { streamPipelinePromise } = require('./utils');

const PUT_OBJECT_LIMIT = 5 * 1024 * 1024 * 1024;

class CosSGunzipFileTask {
  constructor({
    cosInstance,
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    maxTryTime = 3,
  }) {
    const basename = path.basename(key, path.extname(key));
    const dirname = path.dirname(key);
    const extraPaths = [
      extraRootDir.toLowerCase().includes('dirname') ? dirname : '',
    ].filter(Boolean);
    const targetKey = path
      .join(targetPrefix, ...extraPaths, basename)
      .replace(/\\/g, '/');

    Object.assign(this, {
      cosInstance,
      maxTryTime,
      passThrough: null,
      cancelError: null,
      params: {
        headObject: {
          Bucket: bucket,
          Region: region,
          Key: key,
        },
        getObjectStream: {
          Bucket: bucket,
          Region: region,
          Key: key,
        },
        putObject: {
          Bucket: targetBucket,
          Region: targetRegion,
          Key: targetKey,
        },
      },
    });
  }
  async runTask() {
    let result = {};
    let error = null;
    for (let i = 0; i < this.maxTryTime; i++) {
      try {
        if (this.cancelError) {
          throw this.cancelError;
        }
        result = await this.runTaskOnce();
        error = null;
        break;
      } catch (err) {
        error = err;
        // if task is canceled or error cause by cancelError, do not retry
        if (
          this.cancelError
          || (error.error
            && error.error.message
            && error.error.message.includes
            && error.error.message.includes('checkFileSize'))
        ) {
          break;
        }
      }
    }
    return [
      {
        params: this.params,
        result,
        error,
      },
    ];
  }
  async runTaskOnce() {
    try {
      await this.checkFileSize();
    } catch (error) {
      throw {
        trace: 'CosSGunzipFileTask.checkFileSize',
        error,
      };
    }
    try {
      const result = await this.gunzipAndUpload();
      return result;
    } catch (error) {
      throw {
        trace: 'CosSGunzipFileTask.gunzipAndUpload',
        error,
      };
    }
  }
  async checkFileSize() {
    const { headers = {} } = await this.cosInstance.headObject({
      ...this.params.headObject,
    });
    const fileSize = parseInt(headers['content-length'], 10);
    if (!fileSize) {
      throw new Error(`checkFileSize error, fileSize(${fileSize}) is not legal`);
    } else if (fileSize > PUT_OBJECT_LIMIT) {
      throw new Error(`checkFileSize error, fileSize(${fileSize}) is larger than PUT_OBJECT_LIMIT(${PUT_OBJECT_LIMIT})`);
    }
  }
  async gunzipAndUpload() {
    this.passThrough = new PassThrough();
    const result = await Promise.all([
      this.cosInstance.putObject({
        ...this.params.putObject,
        Body: this.passThrough,
      }),
      streamPipelinePromise([
        this.cosInstance.getObjectStream({
          ...this.params.getObjectStream,
        }),
        zlib.createGunzip(),
        this.passThrough,
      ]),
    ]);
    this.passThrough = null;
    return result[0];
  }
  cancelTask(error = new Error('task is canceled')) {
    this.cancelError = error;
    if (this.passThrough) {
      this.passThrough.emit('error', error);
    }
  }
}

module.exports = CosSGunzipFileTask;
