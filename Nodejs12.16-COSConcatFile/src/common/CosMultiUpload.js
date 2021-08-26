/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-const */
const CosSdk = require('cos-nodejs-sdk-v5');
const Async = require('async');
const {
  CRC64TransformStream,
} = require('@annexwu-packages/simple-stream-utils');
const { retry } = require('./utils');

class CosMultiUpload {
  /**
   * @param {Object} options
   * @param {Object} options.cos - the constructor's parameter of cos-nodejs-sdk-v5, reference documents: https://github.com/tencentyun/cos-nodejs-sdk-v5, you can set cosSdkInstance or cos
   * @param {Object} options.cosSdkInstance - an instance of cos-nodejs-sdk-v5, reference documents: https://github.com/tencentyun/cos-nodejs-sdk-v5, you can set cosSdkInstance or cos
   * @param {Number} options.defaultChunkSize - the default chunk size of cos multiple upload, the unit is byte
   * @param {String} options.mode - the way to get upload id, NEW_UPLOAD_ID_ONLY or ALL_UPLOAD_ID_ALLOW
   * @param {String} options.maxTryTimes - the try times
   *
   * @example
   * new CosMultiUpload({
   *  cos: {
   *    SecretId: 'xxxxxx',
   *    SecretKey: 'xxxxxx'
   *  },
   *  defaultChunkSize: 8 * 1024 * 1024,
   *  mode: 'NEW_UPLOAD_ID_ONLY'
   * })
   */
  constructor({
    cos,
    cosSdkInstance,
    defaultChunkSize = 8 * 1024 * 1024,
    mode = 'NEW_UPLOAD_ID_ONLY',
    cacheData = {},
    maxTryTimes = 3,
    ...args
  }) {
    Object.assign(this, {
      defaultChunkSize,
      mode,
      cacheData,
      maxTryTimes,
      ...args,
    });
    this.presetCosSdkInstance(cosSdkInstance || new CosSdk(cos));
  }
  /**
   * add retry methods to cosSdkInstance
   */
  presetCosSdkInstance(cosSdkInstance) {
    const methods = Object.keys(CosSdk.prototype).filter(method => !method.includes('Retry'));
    const result = {};
    methods.forEach((method) => {
      result[method] = (...args) => cosSdkInstance[method](...args);
      result[`${method}Retry`] = retry({
        func: async (...args) => {
          let { Body = {}, GetBody } = args[0] || {};
          if (GetBody) {
            Body = GetBody();
            args[0].Body = Body;
          }
          try {
            const res = await cosSdkInstance[method](...args);
            return res;
          } catch (err) {
            throw err;
          }
        },
        maxTryTime: this.maxTryTimes,
      });
    });
    this.cosSdkInstance = result;
  }
  /**
   * get upload id
   * if cacheData has upload id, use it
   * otherwise if mode is 'NEW_UPLOAD_ID_ONLY', that multipartInit and get the new upload id
   * otherwise if mode is 'ALL_UPLOAD_ID_ALLOW', that try to get the useful upload id by multipartList
   */
  async multipartInit({ uuid }) {
    if (this.cacheData[uuid].process.UploadId) {
      return;
    }
    const { Bucket, Region, Key, ContentLength, ...multipartInitParams } =      this.cacheData[uuid].object;
    if (this.mode === 'NEW_UPLOAD_ID_ONLY') {
      const { UploadId } = await this.cosSdkInstance.multipartInitRetry({
        Bucket,
        Region,
        Key,
        ...multipartInitParams,
      });
      this.cacheData[uuid].process.UploadId = UploadId;
    } else {
      const { Upload = [] } = await this.cosSdkInstance.multipartListRetry({
        Bucket,
        Region,
        Prefix: Key,
      });
      const uploadIds = Upload.filter(item => item.Key === Key).map(item => item.UploadId);
      if (uploadIds.length) {
        this.cacheData[uuid].process.UploadId = uploadIds[0];
      } else {
        const { UploadId } = await this.cosSdkInstance.multipartInitRetry({
          Bucket,
          Region,
          Key,
          ...multipartInitParams,
        });
        this.cacheData[uuid].process.UploadId = UploadId;
      }
    }
    this.cacheData[uuid].process.Parts = [];
  }
  /**
   * list uploaded parts and update cacheData
   */
  async multipartListPart({ uuid }) {
    if (
      this.cacheData[uuid].process.Parts
      && this.cacheData[uuid].process.Parts.length
    ) {
      return;
    }
    const { Bucket, Region, Key } = this.cacheData[uuid].object;
    const { UploadId } = this.cacheData[uuid].process;
    const Part = [];
    const params = {
      Bucket,
      Region,
      Key,
      UploadId,
    };
    while (true) {
      const {
        Part: SomePart = [],
        NextPartNumberMarker,
        IsTruncated,
      } = await this.cosSdkInstance.multipartListPartRetry({
        ...params,
      });
      Part.push(...SomePart);
      if (IsTruncated === 'true') {
        params.PartNumberMarker = NextPartNumberMarker;
      } else {
        break;
      }
    }
    this.cacheData[uuid].process.Parts = Part.map(({ PartNumber, ETag }) => ({
      partNumber: parseInt(PartNumber, 10),
      etag: ETag,
    }));
  }
  /**
   * complete multipart upload
   */
  async multipartComplete({ uuid }) {
    const { Bucket, Region, Key } = this.cacheData[uuid].object;
    const { UploadId, Parts } = this.cacheData[uuid].process;
    const orderParts = [].concat(Parts);
    orderParts.sort((item1, item2) => item1.partNumber - item2.partNumber);
    const res = await this.cosSdkInstance.multipartCompleteRetry({
      Bucket,
      Region,
      Key,
      UploadId,
      Parts: orderParts.map(({ partNumber, etag }) => ({
        PartNumber: partNumber,
        ETag: etag,
      })),
    });
    delete this.cacheData[uuid];
    return res;
  }
  /**
   * when a part upload success, update the Parts property of cacheData
   */
  updateParts({ uuid, partNumber, etag }) {
    const { Parts } = this.cacheData[uuid].process;
    const index = Parts.findIndex(item => item.partNumber === partNumber);
    if (index > -1) {
      Parts.splice(index, 1, { partNumber, etag });
    } else {
      Parts.push({ partNumber, etag });
    }
  }
  /**
   * check if a part is uploaded from cacheData
   */
  checkPart({ uuid, partNumber }) {
    const { Parts } = this.cacheData[uuid].process;
    const item = Parts.find(item => item.partNumber === partNumber);
    return item && item.etag;
  }
  /**
   * calculate the available defaultChunkSize
   */
  getDefaultChunkSize(contentLength) {
    if (!contentLength) {
      return this.defaultChunkSize;
    }
    const min = 1024 * 1024;
    const max = 5 * 1024 * 1024 * 1024;
    for (let i = min; i < max; i = i * 2) {
      if (contentLength <= i * 10000) {
        return Math.max(i, this.defaultChunkSize);
      }
    }
    return Math.max(max, this.defaultChunkSize);
  }
  multipartUpload({ uuid }) {
    const { ContentLength } = this.cacheData[uuid].object;
    const { chunkSize, parallel = 3 } = this.cacheData[uuid];
    const count = Math.ceil(ContentLength / chunkSize);
    const partNumberList = Array(count)
      .fill(0)
      .map((item, index) => index + 1);

    return new Promise((resolve, reject) => {
      Async.mapLimit(
        partNumberList,
        parallel,
        async (partNumber) => {
          try {
            const result = await this.multipartUploadOnePart({
              uuid,
              partNumber,
            });
            return result;
          } catch (error) {
            if (error.statusCode === 403) {
              throw error;
            }
            return {
              error,
            };
          }
        },
        (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          const errors = results
            .map(item => item && item.error)
            .filter(Boolean);
          if (errors.length) {
            reject(errors);
          } else {
            resolve();
          }
        },
      );
    });
  }
  async multipartUploadOnePart({ uuid, partNumber }) {
    if (this.checkPart({ uuid, partNumber })) {
      return;
    }
    const { Bucket, Region, Key, ContentLength } = this.cacheData[uuid].object;
    const { UploadId } = this.cacheData[uuid].process;
    const { chunkSize, getReadStream } = this.cacheData[uuid];
    const streamSize =      chunkSize * partNumber <= ContentLength
      ? chunkSize
      : ContentLength - chunkSize * (partNumber - 1);
    const start = chunkSize * (partNumber - 1);
    const end = start + streamSize;
    let crc64Hash = '';
    const data = await this.cosSdkInstance.multipartUploadRetry({
      Bucket,
      Region,
      Key,
      UploadId,
      PartNumber: partNumber,
      ContentLength: streamSize,
      GetBody: () => {
        const crc64TransformStream = new CRC64TransformStream();
        crc64TransformStream.on('hash', hash => (crc64Hash = hash));
        return getReadStream(start, end)
          .on('error', err => crc64TransformStream.emit('error', err))
          .pipe(crc64TransformStream);
      },
    });
    if (crc64Hash !== data.headers['x-cos-hash-crc64ecma']) {
      this.updateParts({ uuid, partNumber, etag: '' });
      throw {
        crc64Hash,
        headers: data.headers,
      };
    } else {
      this.updateParts({ uuid, partNumber, etag: data.ETag });
    }
  }
  /**
   * @param {Object} options
   * @param {Object} options.object
   * @param {String} options.object.Bucket
   * @param {String} options.object.Region
   * @param {String} options.object.Key
   * @param {Number} options.object.ContentLength
   * @param {String} options.uuid
   * @param {Number} options.chunkSize
   * @param {Number} options.parallel
   * @param {Function} options.getReadStream
   */
  async runTask({
    object: { Bucket, Region, Key, ContentLength, ...args },
    uuid = '',
    chunkSize,
    parallel = 3,
    getReadStream,
  }) {
    chunkSize = chunkSize || this.getDefaultChunkSize(ContentLength);
    uuid = `${Bucket}-${Region}-${Key}-${chunkSize}-${
      ContentLength || 'unknow'
    }-${uuid}`;
    const defaultCacheData = {
      object: {
        Bucket,
        Region,
        Key,
        ContentLength,
        ...args,
      },
      process: {},
      chunkSize,
      parallel,
      getReadStream,
    };
    this.cacheData[uuid] = this.cacheData[uuid] || defaultCacheData;
    try {
      await this.multipartInit({ uuid });
      await this.multipartListPart({ uuid });
      await this.multipartUpload({ uuid });
      const result = await this.multipartComplete({ uuid });
      return result;
    } catch (err) {
      if (err.code === 'NoSuchUpload') {
        delete this.cacheData[uuid];
      }
      throw err;
    }
  }
}

module.exports = CosMultiUpload;
