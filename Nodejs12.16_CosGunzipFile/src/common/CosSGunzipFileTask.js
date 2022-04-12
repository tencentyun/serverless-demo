const path = require('path');
const zlib = require('zlib');
const { PassThrough } = require('stream');
const { inspect } = require('util');
const {
  streamPipelinePromise,
  getMetaFromUrl,
  getRangeStreamFromUrl,
} = require('./utils');

const DataCacheReadStream = require('./DataCacheReadStream');

class CosSGunzipFileTask {
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
      cosUpload,
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
        console.log(inspect(error, { depth: 10 }));
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
    }
  }
  async gunzipAndUpload() {
    this.passThrough = new PassThrough();
    const url = this.cosInstance.getObjectUrl({
      ...this.params.getObjectStream,
      Sign: true,
      Expires: 24 * 60 * 60,
    });
    const meta = await getMetaFromUrl(url);
    const dataCacheReadStream = new DataCacheReadStream({
      totalSize: meta['content-length'] * 1,
      blockSize: 8 * 1024 * 1024,
      maxTaskSize: 10,
      getRangeReadStream: ({ start, end }) => getRangeStreamFromUrl({ url, start, end }),
    });

    const result = await Promise.all([
      this.cosUpload.runTask({
        object: {
          ...this.params.putObject,
        },
        getReadStream: () => this.passThrough,
      }),
      streamPipelinePromise([
        dataCacheReadStream,
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
