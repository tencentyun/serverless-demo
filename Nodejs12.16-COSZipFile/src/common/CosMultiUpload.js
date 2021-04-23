/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
const CosSdk = require('cos-nodejs-sdk-v5');
const QueueConsumerWriteStream = require('./QueueConsumerWriteStream');
const ExpectChunkSizeTransformStream = require('./ExpectChunkSizeTransformStream');
const { PassThrough } = require('stream');
const { retry } = require('./utils');

const GLOBAL_COS_CACHE_DATA = {};

class CosMultiUpload {
  constructor({
    cos,
    cosSdkInstance,
    object,
    uuid,
    defaultChunkSize,
    mode = 'NEW_UPLOAD_ID_ONLY',
    ...args
  }) {
    Object.assign(this, {
      object,
      uuid,
      defaultChunkSize,
      mode,
      partNumber: 0,
      result: null,
      ...args,
    });
    this.presetCosSdkInstance(cosSdkInstance || new CosSdk(cos));
    this.cacheData = this.manageGlobalCacheData('get');
  }
  /**
   * add force cancel and retry methods to cosSdkInstance
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
        maxTryTime: 3,
      });
    });
    this.cosSdkInstance = result;
  }
  /**
   * get params from object and cacheData
   */
  getParams() {
    return {
      ...this.object,
      ...this.cacheData,
    };
  }
  /**
   * get or remove cacheData object from GLOBAL_COS_CACHE_DATA
   */
  manageGlobalCacheData(action) {
    const { Bucket, Region, Key } = this.getParams();
    const uuid = this.uuid || `${Bucket}-${Region}-${Key}`;
    if (action === 'get') {
      GLOBAL_COS_CACHE_DATA[uuid] = GLOBAL_COS_CACHE_DATA[uuid] || {};
      return GLOBAL_COS_CACHE_DATA[uuid];
    }
    if (action === 'remove') {
      if (GLOBAL_COS_CACHE_DATA && GLOBAL_COS_CACHE_DATA[uuid]) {
        delete GLOBAL_COS_CACHE_DATA[uuid];
      }
      this.cacheData = {};
    }
  }
  /**
   * get upload id
   * if cacheData has upload id, use it
   * otherwise if mode is 'NEW_UPLOAD_ID_ONLY', that multipartInit and get the new upload id
   * otherwise if mode is 'ALL_UPLOAD_ID_ALLOW', that try to get the useful upload id by multipartList
   */
  async multipartInit() {
    if (this.cacheData.UploadId) {
      return;
    }
    const { Bucket, Region, Key } = this.getParams();
    const { ...multipartInitParams } = this.object;
    if (this.mode === 'NEW_UPLOAD_ID_ONLY') {
      const { UploadId } = await this.cosSdkInstance.multipartInitRetry(multipartInitParams);
      this.cacheData.UploadId = UploadId;
    } else {
      const { Upload = [] } = await this.cosSdkInstance.multipartListRetry({
        Bucket,
        Region,
        Prefix: Key,
      });
      const uploadIds = Upload.filter(item => item.Key === Key).map(item => item.UploadId);
      if (uploadIds.length) {
        this.cacheData.UploadId = uploadIds[0];
      } else {
        const { UploadId } = await this.cosSdkInstance.multipartInitRetry(multipartInitParams);
        this.cacheData.UploadId = UploadId;
      }
    }
    this.cacheData.Parts = [];
  }
  /**
   * list uploaded parts and update cacheData
   */
  async multipartListPart() {
    if (this.cacheData.Parts && this.cacheData.Parts.length) {
      return;
    }
    const { Bucket, Region, Key, UploadId } = this.getParams();
    const { Part = [] } = await this.cosSdkInstance.multipartListPartRetry({
      Bucket,
      Region,
      Key,
      UploadId,
    });
    this.cacheData.Parts = Part.map(({ PartNumber, ETag }) => ({
      PartNumber: parseInt(PartNumber, 10),
      ETag,
    }));
  }
  /**
   * complete multipart upload
   */
  async multipartComplete() {
    const { Bucket, Region, Key, UploadId, Parts } = this.getParams();
    const orderParts = [].concat(Parts);
    orderParts.sort((item1, item2) => item1.PartNumber - item2.PartNumber);
    const res = await this.cosSdkInstance.multipartCompleteRetry({
      Bucket,
      Region,
      Key,
      UploadId,
      Parts: orderParts,
    });
    this.result = res;
    this.manageGlobalCacheData('remove');
    return res;
  }
  /**
   * when a part upload success, update the Parts property of cacheData
   */
  updateParts({ PartNumber, ETag }) {
    const { Parts } = this.cacheData;
    const index = Parts.findIndex(item => item.PartNumber === PartNumber);
    if (index > -1) {
      Parts.splice(index, 1, { PartNumber, ETag });
    } else {
      Parts.push({ PartNumber, ETag });
    }
  }
  /**
   * check if a part is uploaded from cacheData
   */
  checkPart({ PartNumber }) {
    const { Parts } = this.cacheData;
    return Parts.find(item => item.PartNumber === PartNumber);
  }
  async getStream() {
    try {
      this.partNumber = 0;
      await this.multipartInit();
      await this.multipartListPart();
      const expectChunkSizeTransformStream = new ExpectChunkSizeTransformStream({
        chunkSize: this.defaultChunkSize,
      });
      const queueConsumerWriteStream = new QueueConsumerWriteStream({
        beforePushTask: ({ chunk }) => {
          this.partNumber += 1;
          return {
            Body: chunk,
            PartNumber: this.partNumber,
          };
        },
        consumer: async ({ PartNumber, Body }) => {
          const { Bucket, Region, Key, UploadId } = this.getParams();
          if (this.checkPart({ PartNumber })) {
            return;
          }
          const { ETag } = await this.cosSdkInstance.multipartUploadRetry({
            Bucket,
            Region,
            Key,
            UploadId,
            PartNumber,
            ContentLength: Body.length,
            Body,
          });
          this.updateParts({ PartNumber, ETag });
        },
        beforeFinal: () => this.multipartComplete(),
      });
      const passThrough = new PassThrough();
      passThrough
        .pipe(expectChunkSizeTransformStream)
        .on('error', err => passThrough.emit('error', err))
        .pipe(queueConsumerWriteStream)
        .on('error', err => passThrough.emit('error', err))
        .on('finish', () => passThrough.emit('success', this.result || {}));
      return passThrough;
    } catch (err) {
      if (err.code === 'NoSuchUpload') {
        this.manageGlobalCacheData('remove');
      }
      throw err;
    }
  }
}

module.exports = CosMultiUpload;
