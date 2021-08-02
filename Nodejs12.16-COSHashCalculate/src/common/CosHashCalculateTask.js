const CosSdk = require('cos-nodejs-sdk-v5');
const Async = require('async');
const { PassThrough } = require('stream');
const {
  CRC64TransformStream,
  TrashWriteStream,
} = require('@annexwu-packages/simple-stream-utils');
const HashTransformStream = require('./HashTransformStream');
const {
  retry,
  getUUID,
  getObject,
  getDiffList,
  streamPipelinePromise,
  getRangeStreamFromUrl,
} = require('./utils');

class CosHashCalculateTask {
  constructor({
    secretId,
    secretKey,
    token,
    objects,
    hashTypeList,
    caseType,
    triggerType,
    ...args
  }) {
    this.cosSdkInstance = new CosSdk({
      SecretId: secretId,
      SecretKey: secretKey,
      XCosSecurityToken: token,
    });
    Object.assign(this, {
      ...args,
      objects,
      hashTypeList,
      caseType,
      triggerType,
      status: 'waiting',
      runningTask: {},
    });
    for (const method of ['getHash', 'setHash']) {
      this[`${method}Retry`] = retry({
        func: (...args) => {
          if (this.status === 'canceled') {
            return Promise.reject(this.cancelError);
          }
          return this[method](...args);
        },
      });
    }
  }
  runTask() {
    this.status = 'running';
    return new Promise(async (resolve) => {
      Async.mapLimit(
        this.objects,
        3,
        async (item) => {
          const result = await this.runOneTask(item);
          return result;
        },
        (err, results) => resolve(results),
      );
    });
  }
  async runOneTask({ bucket, region, key }) {
    const taskId = getUUID();
    let result;
    let error;
    try {
      if (this.status === 'canceled') {
        throw this.cancelError;
      }
      const hasLoopRisk = await this.checkLoopRisk({
        bucket,
        region,
        key,
      });
      if (hasLoopRisk) {
        result =          'this cos object is a scf cos hash calculate result, to avoid loop trigger, we skip it';
      } else {
        const hashMap = await this.getHashRetry({
          bucket,
          region,
          key,
          getInterceptor: () => {
            this.runningTask[taskId] = new PassThrough();
            return this.runningTask[taskId];
          },
        });
        result = await this.setHashRetry({
          bucket,
          region,
          key,
          hashMap,
        });
      }
    } catch (err) {
      error = err;
    } finally {
      delete this.runningTask[taskId];
    }
    return {
      params: {
        bucket,
        region,
        key,
      },
      result,
      error,
    };
  }
  async checkLoopRisk({ bucket, region, key }) {
    const { headers = {} } = await this.cosSdkInstance.headObject({
      Bucket: bucket,
      Region: region,
      Key: key,
    });
    return headers['x-cos-meta-scf-cos-hash-calculate'] === 'true';
  }
  async getHash({ bucket, region, key, getInterceptor }) {
    const url = this.cosSdkInstance.getObjectUrl({
      Bucket: bucket,
      Region: region,
      Key: key,
      Expires: 24 * 60 * 60,
      Sign: true,
    });
    const result = {};
    const transformList = this.hashTypeList.map((hashType) => {
      let stream = new PassThrough();
      if (hashType === 'crc64') {
        stream = new CRC64TransformStream();
      } else if (hashType === 'md5') {
        stream = new HashTransformStream({
          algorithm: 'md5',
          digestEncoding: 'hex',
        });
      } else if (hashType === 'sha1') {
        stream = new HashTransformStream({
          algorithm: 'sha1',
          digestEncoding: 'hex',
        });
      } else if (hashType === 'sha256') {
        stream = new HashTransformStream({
          algorithm: 'sha256',
          digestEncoding: 'hex',
        });
      }
      return stream.on('hash', (hash) => {
        result[hashType] =          this.caseType === 'uppercase'
          ? `${hash}`.toUpperCase()
          : `${hash}`.toLowerCase();
      });
    });
    await streamPipelinePromise([
      getRangeStreamFromUrl({ url }),
      getInterceptor(),
      ...transformList,
      new TrashWriteStream(),
    ]);
    return result;
  }
  async setHash({ bucket: Bucket, region: Region, key: Key, hashMap }) {
    const url = this.cosSdkInstance.getObjectUrl({
      Bucket,
      Region,
      Key,
      Sign: false,
    });
    const { headers = {} } = await this.cosSdkInstance.headObject({
      Bucket,
      Region,
      Key,
    });
    const acls = await this.cosSdkInstance.getObjectAcl({
      Bucket,
      Region,
      Key,
    });
    const { Tags = [] } = await this.cosSdkInstance.getObjectTagging({
      Bucket,
      Region,
      Key,
    });
    const aclParamsKeys = getDiffList(Object.keys(acls), [
      'Grants',
      'headers',
      'Owner',
      'RequestId',
      'statusCode',
    ]);
    const metaHeadersKeys = getDiffList(Object.keys(headers), [
      'connection',
      'content-length',
      'date',
      'etag',
      'last-modified',
      'server',
      'x-cos-tagging-count',
      'x-cos-hash-crc64ecma',
      'x-cos-request-id',
    ]);
    const aclParams = getObject(acls, aclParamsKeys);
    const metaHeaders = getObject(headers, metaHeadersKeys);
    Object.keys(hashMap).forEach((key) => {
      metaHeaders[`x-cos-meta-hash-${key}`] = `${hashMap[key]}`;
    });
    metaHeaders['x-cos-meta-scf-cos-hash-calculate'] = 'true';
    if (this.triggerType === 'cosWorkflow') {
      metaHeaders['x-cos-meta-source'] = 'cos-data-process';
    }
    const result = await this.cosSdkInstance.putObjectCopy({
      Bucket,
      Region,
      Key,
      CopySource: url.slice('https://'.length),
      MetadataDirective: 'Replaced',
      Headers: metaHeaders,
      ...aclParams,
    });
    await this.cosSdkInstance.putObjectTagging({
      Bucket,
      Region,
      Key,
      Tags,
    });
    return result;
  }
  async cancelTask(error = new Error('task is canceled')) {
    this.status = 'canceled';
    this.cancelError = error;
    const taskIds = Object.keys(this.runningTask);
    for (const taskId of taskIds) {
      const task = this.runningTask[taskId];
      delete this.runningTask[taskId];
      task.emit('error', error);
    }
  }
}

module.exports = CosHashCalculateTask;
