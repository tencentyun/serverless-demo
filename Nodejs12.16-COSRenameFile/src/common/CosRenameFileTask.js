/* eslint-disable arrow-body-style */
const CosSdk = require('cos-nodejs-sdk-v5');
const Async = require('async');
const path = require('path');
const moment = require('moment-timezone');
const { PassThrough } = require('stream');
const { TrashWriteStream } = require('@annexwu-packages/simple-stream-utils');
const HashTransformStream = require('./HashTransformStream');
const {
  retry,
  getUUID,
  getObject,
  getDiffList,
  replaceTemplate,
  streamPipelinePromise,
  getRangeStreamFromUrl,
} = require('./utils');

const HASH_TYPE_LIST = [
  {
    placeholder: '${CRC64}',
    algorithm: 'crc64',
    headerKey: 'x-cos-hash-crc64ecma',
  },
  { placeholder: '${MD5}', algorithm: 'md5' },
  { placeholder: '${SHA1}', algorithm: 'sha1' },
  { placeholder: '${SHA256}', algorithm: 'sha256' },
];

class CosRenameFileTask {
  constructor({
    secretId,
    secretKey,
    token,
    objects,
    triggerType,
    targetKeyTemplate,
    deleteSourceKey,
    defaultTimezone,
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
      triggerType,
      targetKeyTemplate,
      deleteSourceKey,
      defaultTimezone,
      status: 'waiting',
      runningTask: {},
      replaceMap: {},
      cacheData: {},
    });
    // add retry logic
    for (const method of ['initReplaceMap', 'copyFile', 'deleteFile']) {
      this[`${method}Retry`] = retry({
        func: (...args) => {
          if (this.status === 'canceled') {
            return Promise.reject(this.cancelError);
          }
          return this[method](...args);
        },
      });
    }
    // add cache logic
    for (const method of ['headObject']) {
      this.cosSdkInstance[`inner_${method}`] = this.cosSdkInstance[method];
      this.cosSdkInstance[method] = async (...args) => {
        const cacheDataKey = `${method}_${args
          .map(item => JSON.stringify(item))
          .join(',')}`;
        if (this.cacheData[cacheDataKey]) {
          return this.cacheData[cacheDataKey];
        }
        const result = await this.cosSdkInstance[`inner_${method}`](...args);
        this.cacheData[cacheDataKey] = result;
        return result;
      };
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
        result =          'this cos object is a scf cos rename file result, to avoid loop trigger, we skip it';
      } else if (/\/$/.test(key)) {
        result = 'this cos object is a directory, we skip it';
      } else {
        await this.initReplaceMapRetry({
          bucket,
          region,
          key,
          getInterceptor: () => {
            this.runningTask[taskId] = new PassThrough();
            return this.runningTask[taskId];
          },
        });
        result = await this.copyFileRetry({
          bucket,
          region,
          key,
        });
        if (this.deleteSourceKey) {
          await this.deleteFileRetry({
            bucket,
            region,
            key,
          });
        }
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
    return headers['x-cos-meta-scf-cos-rename-file'] === 'true';
  }
  async initReplaceMap({ bucket, region, key, getInterceptor }) {
    const url = this.cosSdkInstance.getObjectUrl({
      Bucket: bucket,
      Region: region,
      Key: key,
      Expires: 24 * 60 * 60,
      Sign: true,
    });
    const { headers: metaHeaders = {} } = await this.cosSdkInstance.headObject({
      Bucket: bucket,
      Region: region,
      Key: key,
    });
    const lastModifiedTime = this.defaultTimezone
      ? moment(metaHeaders['last-modified']).tz(this.defaultTimezone)
      : moment(metaHeaders['last-modified']);
    const lastModifiedTimeStr = lastModifiedTime.format('YYYY-MM-DD-HH-mm-ss');
    const [year, month, day, hour, minute, second] =      lastModifiedTimeStr.split('-');
    Object.assign(this.replaceMap, {
      '${Bucket}': bucket,
      '${Region}': region,
      '${Key}': key,
      '${InputPath}': key.replace(/[^/]+$/, ''),
      '${InputFullName}': path.basename(key),
      '${InputName}': path.basename(key, path.extname(key)),
      '${Ext}': path.extname(key),
      '${Year}': year,
      '${Month}': month,
      '${Day}': day,
      '${Hour}': hour,
      '${Minute}': minute,
      '${Second}': second,
      '${CRC64}': metaHeaders['x-cos-hash-crc64ecma'],
    });
    const hashReplaceMap = {};
    const hashTypeList = HASH_TYPE_LIST.filter(({ placeholder, headerKey }) => {
      return this.targetKeyTemplate.includes(placeholder) && !headerKey;
    }).map(({ algorithm }) => algorithm);
    const transformList = hashTypeList.map((hashType) => {
      const stream = new HashTransformStream({
        algorithm: hashType,
        digestEncoding: 'hex',
      });
      return stream.on('hash', (hash) => {
        hashReplaceMap[`\${${hashType.toUpperCase()}}`] =          `${hash}`.toLowerCase();
      });
    });
    if (transformList.length) {
      await streamPipelinePromise([
        getRangeStreamFromUrl({ url }),
        getInterceptor(),
        ...transformList,
        new TrashWriteStream(),
      ]);
    }
    Object.assign(this.replaceMap, hashReplaceMap);
  }
  async copyFile({ bucket: Bucket, region: Region, key: Key }) {
    const url = this.cosSdkInstance.getObjectUrl({
      Bucket,
      Region,
      Key,
      Sign: false,
    });
    const [{ headers = {} }, acls, { Tags = [] }] = await Promise.all([
      this.cosSdkInstance.headObject({
        Bucket,
        Region,
        Key,
      }),
      this.cosSdkInstance.getObjectAcl({
        Bucket,
        Region,
        Key,
      }),
      this.cosSdkInstance.getObjectTagging({
        Bucket,
        Region,
        Key,
      }),
    ]);
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
    metaHeaders['x-cos-meta-scf-cos-rename-file'] = 'true';
    if (this.triggerType === 'cosWorkflow') {
      metaHeaders['x-cos-meta-source'] = 'cos-data-process';
    }
    const targetKey = replaceTemplate(this.targetKeyTemplate, this.replaceMap);
    await this.cosSdkInstance.putObjectCopy({
      Bucket,
      Region,
      Key: targetKey,
      CopySource: url.replace(/^(https|http):\/\//, ''),
      MetadataDirective: 'Replaced',
      Headers: metaHeaders,
      ...aclParams,
    });
    if (Tags && Tags.length) {
      await this.cosSdkInstance.putObjectTagging({
        Bucket,
        Region,
        Key: targetKey,
        Tags,
      });
    }
    return {
      bucket: Bucket,
      region: Region,
      key: targetKey,
    };
  }
  async deleteFile({ bucket, region, key }) {
    const res = await this.cosSdkInstance.deleteObject({
      Bucket: bucket,
      Region: region,
      Key: key,
    });
    return res;
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

module.exports = CosRenameFileTask;
