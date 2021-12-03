/* eslint-disable no-param-reassign */
const Async = require('async');
const getMultipleReadStream = require('./getMultipleReadStream');
const {
  getMetaFromUrl,
  tryAddCosSignature,
  getRangeStreamFromUrl,
} = require('./utils');

class CosConcatFileTask {
  constructor({
    cosSdkInstance,
    cosUpload,
    sourceList,
    targetBucket,
    targetRegion,
    targetKey,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      cosUpload,
      sourceList,
      targetBucket,
      targetRegion,
      targetKey,
      totalSize: 0,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      await this.initSourceSize();
      await this.initSourceOffset();
      result = await this.cosUpload.runTask({
        object: {
          Bucket: this.targetBucket,
          Region: this.targetRegion,
          Key: this.targetKey,
          ContentLength: this.totalSize,
        },
        getRangeReadStream: (start, end) => this.getReadStream(start, end),
        getReadStream: () => this.getReadStream(0, this.totalSize),
      });
    } catch (err) {
      error = err;
    }
    return {
      params: {
        sourceList:
          this.sourceList.length > 20
            ? this.sourceList.slice(0, 20)
            : this.sourceList,
        sourceListLength: this.sourceList.length,
        targetBucket: this.targetBucket,
        targetRegion: this.targetRegion,
        targetKey: this.targetKey,
      },
      result,
      error,
    };
  }
  initSourceSize() {
    return new Promise((resolve, reject) => {
      let totalSize = 0;
      Async.mapLimit(
        this.sourceList,
        9,
        async (item) => {
          const signUrl = tryAddCosSignature({
            cosSdkInstance: this.cosSdkInstance,
            url: item.url,
          });
          const meta = await getMetaFromUrl(signUrl);
          item.size = meta['content-length'] || 0;
          item.signUrl = signUrl;
          totalSize += item.size;
        },
        (err) => {
          if (err) {
            reject(err);
          } else {
            this.totalSize = totalSize;
            resolve();
          }
        },
      );
    });
  }
  async initSourceOffset() {
    let offset = 0;
    for (const item of this.sourceList) {
      item.start = offset;
      offset += item.size;
      item.end = offset;
    }
  }
  getRelatedParts(start, end) {
    const parts = [];
    for (const item of this.sourceList) {
      if (item.end <= start || item.start >= end) {
        continue;
      }
      const startOffset = Math.max(item.start, start);
      const endOffset = Math.min(item.end, end);
      parts.push({
        ...item,
        startOffset: startOffset - item.start,
        endOffset: endOffset - item.start,
      });
    }
    return parts;
  }
  getReadStream(start, end) {
    const parts = this.getRelatedParts(start, end);
    return getMultipleReadStream({
      getNextStream: ({ index = 0 } = {}) => {
        const part = parts[index];
        if (!part) {
          return;
        }
        const { startOffset, endOffset, signUrl } = part;
        const stream = getRangeStreamFromUrl({
          url: signUrl,
          start: startOffset,
          end: endOffset,
        });
        return {
          nextParams: {
            index: index + 1,
          },
          stream,
        };
      },
    });
  }
}

module.exports = CosConcatFileTask;
