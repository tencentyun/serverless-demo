/* eslint-disable no-param-reassign */
/* eslint-disable prefer-const */
const path = require('path');
const FileDirTaskQueue = require('./FileDirTaskQueue');
const { getData, getDiffList, replaceTemplate } = require('./utils');

const COS_PUT_OBJECT_LIMIT = 5 * 1024 * 1024 * 1024;
const COS_MAX_OBJECT_SIZE = COS_PUT_OBJECT_LIMIT * 10000;

class CosCopyTaskQueue extends FileDirTaskQueue {
  constructor(
    { cosSdkInstance, interceptor, parallel = 5, maxFailLimit = -1, ...args },
    ...resArgs
  ) {
    super(
      {
        lastResult: {
          success: 0,
          fail: 0,
        },
        parallel,
        ...args,
      },
      ...resArgs,
    );
    Object.assign(this, {
      cosSdkInstance,
      interceptor,
      maxFailLimit,
    });
  }
  async copyFile({
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetKey,
    setHeaders,
    setAcls,
    setTags,
  }) {
    const sourceObject = {
      Bucket: bucket,
      Region: region,
      Key: key,
    };
    const targetObject = {
      Bucket: targetBucket,
      Region: targetRegion,
      Key: targetKey,
    };
    const sourceUrl = this.cosSdkInstance.getObjectUrl({
      ...sourceObject,
      Sign: false,
    });
    const [
      { headers: sourceHeaders = {} },
      sourceAcls = {},
      { Tags: sourceTags = [] },
    ] = await Promise.all([
      this.cosSdkInstance.headObject(sourceObject),
      this.cosSdkInstance.getObjectAcl(sourceObject),
      this.cosSdkInstance.getObjectTagging(sourceObject),
    ]);
    const targetHeaders = this.getHeaders({ sourceHeaders, setHeaders });
    const targetAcls = this.getAcls({ sourceAcls, setAcls });
    const targetTags = this.getTags({ sourceTags, setTags });
    const needUpdateStorage = this.needUpdateStorage({
      region,
      targetRegion,
      sourceHeaders,
      targetHeaders,
    });
    let params = {
      ...targetObject,
      CopySliceSize: needUpdateStorage
        ? COS_PUT_OBJECT_LIMIT
        : COS_MAX_OBJECT_SIZE + 1,
      CopySource: sourceUrl.replace(/^(https|http):\/\//, ''),
      MetadataDirective: 'Replaced',
      Headers: targetHeaders,
      ...targetAcls,
    };
    if (this.interceptor) {
      const {
        params: newParams,
        result,
        error,
      } = await this.interceptor({
        event: 'beforeCopy',
        params,
        sourceObject,
        targetObject,
        sourceHeaders,
        targetHeaders,
        sourceAcls,
        targetAcls,
        sourceTags,
        targetTags,
      });
      if (error) {
        throw error;
      }
      if (result) {
        return result;
      }
      if (newParams) {
        params = newParams;
      }
    }
    const result = await this.cosSdkInstance.sliceCopyFile(params);
    if (targetTags && targetTags.length) {
      await this.cosSdkInstance.putObjectTagging({
        ...targetObject,
        Tags: targetTags,
      });
    }
    return result;
  }
  async deleteSourceFile({
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetKey,
  }) {
    const sourceObject = {
      Bucket: bucket,
      Region: region,
      Key: key,
    };
    const targetObject = {
      Bucket: targetBucket,
      Region: targetRegion,
      Key: targetKey,
    };
    if (
      bucket === targetBucket
      && region === targetRegion
      && key === targetKey
    ) {
      return {
        message: `sourceObject(${JSON.stringify(sourceObject)}) is same as targetObject(${JSON.stringify(targetObject)}), we skip it`,
      };
    }
    const [{ headers: sourceHeaders = {} }, { headers: targetHeaders = {} }] =      await Promise.all([
      this.cosSdkInstance.headObject(sourceObject),
      this.cosSdkInstance.headObject(targetObject),
    ]);
    if (
      sourceHeaders['x-cos-hash-crc64ecma']
      === targetHeaders['x-cos-hash-crc64ecma']
    ) {
      const result = await this.cosSdkInstance.deleteObject(sourceObject);
      return result;
    }
    if (!sourceHeaders['x-cos-hash-crc64ecma']) {
      return {
        message: `sourceObject(${JSON.stringify(sourceObject)}) has not x-cos-hash-crc64ecma headers, we skip it`,
      };
    }
    throw new Error(`crc64 check error: sourceObject(${JSON.stringify(sourceObject)}) is ${
      sourceHeaders['x-cos-hash-crc64ecma']
    }, targetObject(${JSON.stringify(targetObject)}) is ${
      targetHeaders['x-cos-hash-crc64ecma']
    }`);
  }
  needUpdateStorage({ region, targetRegion, sourceHeaders, targetHeaders }) {
    // not same region
    if (region !== targetRegion) {
      return true;
    }
    // change storage class
    if (
      targetHeaders['x-cos-storage-class']
      && targetHeaders['x-cos-storage-class']
        !== (sourceHeaders['x-cos-storage-class'] || 'STANDARD')
      && targetHeaders['x-cos-storage-class']
        !== (sourceHeaders['x-cos-storage-class'] || 'MAZ_STANDARD')
    ) {
      return true;
    }
    // has server side encryption
    if (
      sourceHeaders['x-cos-server-side-encryption']
      || sourceHeaders['x-cos-server-side-encryption-customer-algorithm']
      || targetHeaders['x-cos-server-side-encryption']
      || targetHeaders['x-cos-server-side-encryption-customer-algorithm']
    ) {
      return true;
    }
    return false;
  }
  getHeaders({ sourceHeaders, setHeaders = {} }) {
    const { directive = 'Copy', params = {} } = setHeaders;
    if (directive === 'Replaced') {
      return params;
    }
    const meaningfulHeadersKeys = getDiffList(Object.keys(sourceHeaders), [
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
    const meaningfulHeaders = getData(sourceHeaders, meaningfulHeadersKeys);
    return {
      ...meaningfulHeaders,
      ...(directive === 'Add' ? params : {}),
    };
  }
  getAcls({ sourceAcls, setAcls = {} }) {
    const { directive = 'Copy', params = {} } = setAcls;
    if (directive === 'Replaced') {
      return params;
    }
    const meaningfulAclsKeys = getDiffList(Object.keys(sourceAcls), [
      'Grants',
      'headers',
      'Owner',
      'RequestId',
      'statusCode',
    ]);
    const meaningfulAcls = getData(sourceAcls, meaningfulAclsKeys);
    return {
      ...meaningfulAcls,
      ...(directive === 'Add' ? params : {}),
    };
  }
  getTags({ sourceTags, setTags = {} }) {
    const { directive = 'Copy', params = [] } = setTags;
    if (directive === 'Replaced') {
      return params;
    }
    if (directive === 'Copy') {
      return sourceTags;
    }
    const isExist = params.reduce((res, { Key }) => {
      res[Key] = true;
      return res;
    }, {});
    const meaningfulTags = sourceTags.filter(({ Key }) => !isExist[Key]);
    return meaningfulTags.concat(params);
  }
  getTargetKey({ params }) {
    const {
      bucket,
      region,
      key,
      relativePrefix = '',
      targetKey,
      targetKeyTemplate,
    } = params;
    if (targetKey) {
      return targetKey;
    }
    if (!key.startsWith(relativePrefix)) {
      throw new Error(`object key(${key}) is not starts with relativePrefix(${relativePrefix})`);
    }
    const relativeKey = key.slice(relativePrefix.length);
    return replaceTemplate(targetKeyTemplate || '${Key}', {
      '${Bucket}': bucket,
      '${Region}': region,
      '${Key}': key,
      '${RelativeKey}': relativeKey,
      '${InputPath}': key.replace(/[^/]+$/, ''),
      '${RelativeInputPath}': relativeKey.replace(/[^/]+$/, ''),
      '${InputFullName}': path.basename(key),
      '${InputName}': path.basename(key, path.extname(key)),
      '${Ext}': path.extname(key),
    });
  }
  _filterFileTask({ key, relativePrefix }) {
    return key !== relativePrefix;
  }
  async _processFileTask({ params }) {
    let {
      bucket,
      region,
      key,
      targetBucket,
      targetRegion,
      setHeaders = { directive: 'Copy', params: {} },
      setAcls = { directive: 'Copy', params: {} },
      setTags = { directive: 'Copy', params: [] },
      deleteSourceKey = false,
    } = params;
    targetBucket = targetBucket || bucket;
    targetRegion = targetRegion || region;
    const targetKey = this.getTargetKey({ params });
    const result = await this.copyFile({
      bucket,
      region,
      key,
      targetBucket,
      targetRegion,
      targetKey,
      setHeaders,
      setAcls,
      setTags,
    });
    if (deleteSourceKey && result && result.statusCode === 200) {
      await this.deleteSourceFile({
        bucket,
        region,
        key,
        targetBucket,
        targetRegion,
        targetKey,
      });
    }
    return result;
  }
  async _processFileResult({ lastResult, currentTask }) {
    const { status } = currentTask || {};
    if (status === 'success') {
      lastResult.success += 1;
    } else {
      lastResult.fail += 1;
    }
    if (this.maxFailLimit > -1 && lastResult.fail > this.maxFailLimit) {
      process.nextTick(() => this.cancelTasks(new Error(`fail count is larger than maxFailLimit(${this.maxFailLimit})`)));
    }
    return lastResult;
  }
}

module.exports = CosCopyTaskQueue;
