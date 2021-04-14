const fs = require('fs');
const request = require('request');
const FdSlicer = require('fd-slicer');
const { RandomAccessReader } = require('yauzl');
const {
  appendRetryPromisify,
  streamPromise,
  readStreamAddPassThrough,
} = require('./utils');
class CosRandomAccessReader extends RandomAccessReader {
  constructor({
    cosInstance,
    Bucket,
    Region,
    Key,
    totalSize = 0,
    localOffset = 0,
    localFdSlicer = null,
    localPath = '/tmp/temp.zip',
    localSizeLimit = 450 * 1024 * 1024,
  }) {
    super();
    Object.assign(this, {
      cosInstance,
      Bucket,
      Region,
      Key,
      totalSize,
      localOffset,
      localFdSlicer,
      localPath,
      localSizeLimit,
    });
    appendRetryPromisify({
      target: this,
      keys: ['downloadFile', 'getFdSlicer'],
      promisify: false,
      maxTryTime: 3,
    });
  }
  getObjectUrl() {
    const { cosInstance, Bucket, Region, Key } = this;
    return cosInstance.getObjectUrl({
      Bucket,
      Region,
      Key,
      Expires: 24 * 60 * 60,
      Sign: true,
    });
  }
  async getTotalSize() {
    const { cosInstance, Bucket, Region, Key, localSizeLimit } = this;
    try {
      const { headers } = await cosInstance.headObjectRetryPromise({
        Bucket,
        Region,
        Key,
      });
      this.totalSize = headers['content-length'] * 1;
      console.log(`whole zip file size is ${this.totalSize}`);
    } catch (error) {
      throw {
        error,
        trace: 'CosRandomAccessReader.cosInstance.headObjectRetryPromise',
      };
    }
    this.localOffset = Math.max(this.totalSize - localSizeLimit, 0);
    await this.downloadFileRetry();
    this.localFdSlicer = await this.getFdSlicerRetry();
    console.log(`zip file is downloaded, total size is ${
      this.totalSize
    }, downloaded size is ${this.totalSize - this.localOffset}, offset is ${
      this.localOffset
    }`);
    return this.totalSize;
  }
  async downloadFile() {
    const {
      cosInstance,
      Bucket,
      Region,
      Key,
      totalSize,
      localPath,
      localOffset,
    } = this;
    try {
      const outputStream = fs.createWriteStream(localPath);
      await Promise.all([
        cosInstance.getObjectPromise({
          Bucket,
          Region,
          Key,
          Headers: totalSize === 0 ? {} : { Range: `bytes=${localOffset}-` },
          Output: outputStream,
        }),
        streamPromise(outputStream, 'finish'),
      ]);
    } catch (error) {
      throw {
        error,
        trace: 'CosRandomAccessReader.cosInstance.getObjectPromise',
      };
    }
  }
  /**
   * get file fd and init fd slicer
   */
  getFdSlicer() {
    return new Promise((resolve, reject) => {
      fs.open(this.localPath, 'r', (err, fd) => {
        try {
          if (err) {
            throw err;
          }
          resolve(FdSlicer.createFromFd(fd));
        } catch (error) {
          reject({
            error,
            trace: 'CosRandomAccessReader.getFdSlicer',
          });
        }
      });
    });
  }
  /**
   * if the wanted part is downloaded, read it from disk
   * else read it from request
   */
  getRangeStream({ start, end }) {
    if (this.localFdSlicer && start >= this.localOffset) {
      return this.localFdSlicer.createReadStream({
        start: start - this.localOffset,
        end: end - this.localOffset,
      });
    }
    const readStream = request({
      url: this.getObjectUrl(),
      timeout: 24 * 60 * 60 * 1000,
      headers: {
        Range: `bytes=${start}-${end - 1}`,
      },
    });
    return readStreamAddPassThrough(readStream);
  }
  _readStreamForRange(start, end) {
    return this.getRangeStream({ start, end });
  }
}

module.exports = CosRandomAccessReader;
