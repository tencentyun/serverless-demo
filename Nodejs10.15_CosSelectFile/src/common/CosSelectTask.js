const path = require('path');
const fs = require('fs');
const EventEmitter = require('events');
const ExpectByteCountTransformStream = require('./ExpectByteCountTransformStream');
const { streamPipelinePromise, replaceMap } = require('./utils');
const { PassThrough } = require('stream');
class CosSelectTask {
  constructor({
    cosInstance,
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetPrefix,
    targetNameFormat,
    selectType,
    cosSelectConfig,
    maxTryTime = 3,
    localPath = '/tmp/temp',
    localSizeLimit = 500 * 1024 * 1024,
    sourceSizeLimit = 500 * 1024 * 1024,
  }) {
    const {
      SelectRequest: { OutputSerialization = {} } = {},
    } = cosSelectConfig;

    const basename = path.basename(key, path.extname(key));
    const extname = `${
      Object.keys(OutputSerialization)[0] || ''
    }`.toLowerCase();
    const targetName = replaceMap(targetNameFormat, { basename, extname });
    const targetKey = path.join(targetPrefix, targetName).replace(/\\/g, '/');

    Object.assign(this, {
      cosInstance,
      maxTryTime,
      localPath,
      localSizeLimit,
      sourceSizeLimit,
      passThrough: null,
      uploadEmitter: null,
      uploadTaskId: null,
      params: {
        headObject: {
          Bucket: bucket,
          Region: region,
          Key: key,
        },
        selectObjectContentStream: {
          Bucket: bucket,
          Region: region,
          Key: key,
          SelectType: selectType,
          ...cosSelectConfig,
        },
        uploadFiles: {
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
        if (!this.cancelError) {
          result = await this.runTaskOnce();
          error = null;
          break;
        }
      } catch (err) {
        error = err;
        // if task is canceled or error cause by ExpectByteCountTransformStream, do not retry
        if (
          this.cancelError
          || (error.error
            && error.error.message
            && error.error.message.includes
            && error.error.message.includes('checkSourceSize'))
          || (error.error
            && error.error.message
            && error.error.message.includes
            && error.error.message.includes('ExpectByteCountTransformStream'))
        ) {
          break;
        }
      }
    }
    return {
      params: this.params,
      result,
      error,
    };
  }
  async runTaskOnce() {
    try {
      await this.checkSourceSize();
    } catch (error) {
      throw {
        trace: 'CosSelectTask.checkSourceSize',
        error,
      };
    }
    try {
      await this.getCosSelectResult();
    } catch (error) {
      throw {
        trace: 'CosSelectTask.getCosSelectResult',
        error,
      };
    }
    try {
      const res = await this.uploadCosSelectResult();
      return res;
    } catch (error) {
      throw {
        trace: 'CosSelectTask.uploadCosSelectResult',
        error,
      };
    }
  }
  async checkSourceSize() {
    const { headers } = await this.cosInstance.headObject({
      ...this.params.headObject,
    });
    const sourceSize = parseInt(headers['content-length'], 10);
    if (sourceSize > this.sourceSizeLimit) {
      throw new Error(`checkSourceSize error, sourceSize(${sourceSize}) is larger than sourceSizeLimit(${this.sourceSizeLimit})`);
    }
  }
  async getCosSelectResult() {
    this.passThrough = new PassThrough();
    await streamPipelinePromise([
      this.cosInstance.selectObjectContentStream({
        ...this.params.selectObjectContentStream,
      }),
      new ExpectByteCountTransformStream({
        validateFunc: bytes => bytes <= this.localSizeLimit,
      }),
      this.passThrough,
      fs.createWriteStream(this.localPath),
    ]);
    this.passThrough = null;
  }
  uploadCosSelectResult() {
    return new Promise(async (resolve, reject) => {
      this.uploadEmitter = new EventEmitter();
      this.uploadEmitter.once('error', (err) => {
        if (this.uploadTaskId && this.cancelError) {
          this.cosInstance.cancelTask(this.uploadTaskId);
        }
        reject(err);
      });
      this.uploadTaskId = null;
      this.cosInstance.uploadFiles({
        files: [
          {
            ...this.params.uploadFiles,
            FilePath: this.localPath,
            onTaskReady: (uploadTaskId) => {
              this.uploadTaskId = uploadTaskId;
            },
            onFileFinish: (err, result) => {
              this.uploadTaskId = null;
              if (err) {
                this.uploadEmitter.emit('error', err);
              } else {
                resolve(result);
              }
            },
          },
        ],
      });
    });
  }
  cancelTask(error = new Error('task is canceled')) {
    this.cancelError = error;
    if (this.passThrough) {
      this.passThrough.emit('error', error);
    }
    if (this.uploadEmitter) {
      this.uploadEmitter.emit('error', error);
    }
  }
}

module.exports = CosSelectTask;
