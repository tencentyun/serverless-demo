/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
const zlib = require('zlib');
const { Readable } = require('stream');
const getMultipleReadStream = require('./getMultipleReadStream');
const LineConsumerTransformStream = require('./LineConsumerTransformStream');
const AnalyzeTransformStream = require('./AnalyzeTransformStream');
const FileCache = require('./FileCache');
const { validateAnalyzeConfig, fixAnalyzeConfig } = require('./analyzeUtils');
const { PassThrough } = require('stream');
const { tryAddCosSignature, streamPipelinePromise } = require('./utils');

class CosAnalyzeLogsTask {
  constructor({
    cosSdkInstance,
    cosUpload,
    sourceList,
    targetBucket,
    targetRegion,
    targetKey,
    analyzeConfig = {},
  }) {
    Object.assign(this, {
      cosSdkInstance,
      cosUpload,
      sourceList,
      targetBucket,
      targetRegion,
      targetKey,
      analyzeConfig: fixAnalyzeConfig(analyzeConfig),
      fileCache: null,
      uuidPrefix: `cos_${Date.now() % 1000}_`,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      validateAnalyzeConfig(this.analyzeConfig);
      const passThrough = new PassThrough();
      const readStream = this.getReadStream();
      const { rowDelimiter } = this.analyzeConfig;
      await this.targetSetHeader(passThrough);
      const results = await Promise.all([
        streamPipelinePromise([
          readStream,
          new LineConsumerTransformStream({
            getLineParams: content => this.getLineParams(content),
            lineDelimiterList: rowDelimiter ? [rowDelimiter] : ['\r\n', '\n'],
            filterLineParams: Boolean,
          }),
          new AnalyzeTransformStream({
            ...this.analyzeConfig,
            destroySource: () => readStream.end(),
          }),
          passThrough,
        ]),
        this.cosUpload.runTask({
          object: {
            Bucket: this.targetBucket,
            Region: this.targetRegion,
            Key: this.targetKey,
          },
          getReadStream: () => passThrough,
        }),
      ]);
      result = results[1];
    } catch (err) {
      error = err;
    }
    return {
      params: {
        sourceListLength: this.sourceList.length,
        targetBucket: this.targetBucket,
        targetRegion: this.targetRegion,
        targetKey: this.targetKey,
        analyzeConfig: this.analyzeConfig,
      },
      result,
      error,
    };
  }
  getReadStream() {
    return getMultipleReadStream({
      getNextStream: async ({ index = 0 } = {}) => {
        const part = this.sourceList[index];
        if (!part) {
          return;
        }
        const { url, type } = part;
        const signUrl = tryAddCosSignature({
          cosSdkInstance: this.cosSdkInstance,
          url,
        });
        if (!this.fileCache) {
          await this.initFileCache();
        }
        let stream = await this.fileCache.getReadStream({
          url: signUrl,
        });
        if (type === 'gzip') {
          stream = stream.pipe(zlib.createGunzip());
        }
        return {
          nextParams: {
            index: index + 1,
          },
          stream,
        };
      },
    });
  }
  getLineParams(content) {
    const { columns, colDelimiter } = this.analyzeConfig;
    const placeholderMap = {};
    let index = 0;
    /**
     * try to replace "value" with an unique placeholder in content
     * because "value" may includes colDelimiter, it maybe affected by split method
     */
    content = content.replace(/"([\s\S])*?"/g, (value) => {
      index += 1;
      const uuid = `${this.uuidPrefix}${index}`;
      placeholderMap[uuid] = value;
      return uuid;
    });
    const values = content.split(colDelimiter);
    return columns.reduce((res, { key }, index) => {
      const value = values[index] || '';
      // try to replace the placeholder with true "value"
      res[key] = placeholderMap[value] || value;
      return res;
    }, {});
  }
  async targetSetHeader(passThrough) {
    const {
      select,
      targetRowDelimiter = '\n',
      targetColDelimiter = ',',
      targetSetHeader = true,
    } = this.analyzeConfig;
    if (!targetSetHeader) {
      return;
    }
    const headerStr =      select.map(({ label, key }) => label || key).join(targetColDelimiter)
      + targetRowDelimiter;
    Readable.from([headerStr]).pipe(passThrough, { end: false });
  }
  async initFileCache() {
    this.fileCache = new FileCache({
      cachePath: '/tmp',
      maxCacheSize: 450 * 1024 * 1024,
      maxParallel: 10,
      minTruncateSize: 1 * 1024 * 1024,
    });
    await this.fileCache.init({
      fileList: this.sourceList.map(({ url, ...args }) => {
        const signUrl = tryAddCosSignature({
          cosSdkInstance: this.cosSdkInstance,
          url,
        });
        return {
          url: signUrl,
          ...args,
        };
      }),
    });
  }
}

module.exports = CosAnalyzeLogsTask;
