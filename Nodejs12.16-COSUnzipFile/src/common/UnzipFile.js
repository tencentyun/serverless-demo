/* eslint-disable no-plusplus */
/* eslint-disable no-param-reassign */
const yauzl = require('yauzl');
const CosRandomAccessReader = require('./CosRandomAccessReader');
const { PassThrough } = require('stream');
const { bufferToString, appendRetryPromisify } = require('./utils');

class UnzipFile {
  constructor({ cosInstance, Bucket, Region, Key, zipFile = null }) {
    Object.assign(this, {
      cosInstance,
      Bucket,
      Region,
      Key,
      zipFile,
    });
    appendRetryPromisify({
      target: yauzl,
      keys: ['fromRandomAccessReader'],
      maxTryTime: 3,
    });
  }
  async init({
    lazyEntries = true,
    autoClose = false,
    decodeStrings = false,
    ...args
  } = {}) {
    const { cosInstance, Bucket, Region, Key } = this;
    const reader = new CosRandomAccessReader({
      cosInstance,
      Bucket,
      Region,
      Key,
    });
    const totalSize = await reader.getTotalSize();
    if (totalSize === 0) {
      throw new Error('file size is 0');
    }
    try {
      this.zipFile = await yauzl.fromRandomAccessReaderRetryPromise(
        reader,
        totalSize,
        {
          lazyEntries,
          autoClose,
          decodeStrings,
          ...args,
        },
      );
      appendRetryPromisify({
        target: this.zipFile,
        keys: ['openReadStream'],
        maxTryTime: 1,
      });
    } catch (error) {
      throw {
        error,
        trace: 'UnzipFile.init.yauzl.fromRandomAccessReaderRetryPromise',
      };
    }
  }
  getEntries({ start, end }) {
    return new Promise((resolve, reject) => {
      let tryTime = 0;
      let index = -1;
      const entries = [];

      this.zipFile.on('entry', (entry) => {
        tryTime = 0;
        index++;
        if (start <= index && index <= end) {
          entry.fileNameStr = bufferToString(entry.fileName);
          entries.push({
            entry,
            index,
          });
        }
        if (this.zipFile.isOpen) {
          this.zipFile.readEntry();
        } else {
          reject(new Error('zip file is closed'));
        }
      });

      this.zipFile.on('end', () => {
        this.zipFile.removeAllListeners('error');
        resolve({
          entries,
          length: index + 1,
        });
      });

      this.zipFile.on('error', (err) => {
        tryTime += 1;
        console.log(`on entry error, index: ${entries.length}, tryTime: ${tryTime}`);
        if (tryTime >= 3) {
          reject(err);
        } else {
          this.zipFile.readEntry();
        }
      });

      this.zipFile.readEntry();
    });
  }
  async getStream(entry) {
    if (/\/$/.test(entry.fileNameStr)) {
      const stream = new PassThrough();
      stream.end(Buffer.from(''));
      return stream;
    }

    if (!this.zipFile.isOpen) {
      throw new Error('zip file is closed');
    }

    const stream = await this.zipFile.openReadStreamPromise(entry);

    if (!this.zipFile.isOpen) {
      throw new Error('zip file is closed');
    }

    return stream;
  }
  close() {
    if (this.zipFile && this.zipFile.isOpen) {
      this.zipFile.removeAllListeners('error');
      this.zipFile.close();
    }
  }
}

module.exports = UnzipFile;
