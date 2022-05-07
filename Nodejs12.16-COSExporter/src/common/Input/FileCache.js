const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const fastFolderSizeSync = require('fast-folder-size/sync');
const getMultipleReadStream = require('./getMultipleReadStream');
const {
  getRangeStreamFromUrl,
  getMetaFromUrl,
  promiseMapLimit,
} = require('../utils');

class FileCache {
  constructor({
    cachePath,
    maxCacheSize = 0,
    maxParallel = 10,
    minTruncateSize = 0,
    initDelay = 5000,
    initCacheSize,
    ...args
  }) {
    Object.assign(this, {
      cachePath,
      maxCacheSize,
      maxParallel,
      minTruncateSize,
      currentAllocateSize: 0,
      cacheFileList: [],
      initDelay,
      initTimer: null,
      initCacheSize: Math.floor(initCacheSize || maxCacheSize * 0.9),
      initCallback: null,
      ...args,
    });
  }
  getParallel() {
    return this.cacheFileList.filter(item => item.status === 'downloading')
      .length;
  }
  getCacheFile({ url, status }) {
    if (url) {
      return this.cacheFileList.find(item => item.url.replace(/\?[\s\S]*$/, '') === url.replace(/\?[\s\S]*$/, ''));
    }
    if (status) {
      return this.cacheFileList.find(item => item.status === status);
    }
  }
  updateCacheFile({ url, ...args }) {
    const cacheFile = this.getCacheFile({ url });
    if (!cacheFile) {
      return;
    }
    Object.assign(cacheFile, args);
  }
  addCacheFile({ url, totalSize }) {
    const cacheFile = this.getCacheFile({ url });
    if (cacheFile || !totalSize) {
      return;
    }
    const localPath = path.resolve(
      this.cachePath,
      `${Date.now()}_${crypto.createHash('md5').update(url)
        .digest('hex')}`,
    );
    this.cacheFileList.push({
      url,
      localPath,
      totalSize,
      allocateSize: 0,
      status: 'waiting',
      writeStream: null,
    });
  }
  removeCacheFile({ url }) {
    const cacheFile = this.getCacheFile({ url });
    if (!cacheFile) {
      return;
    }
    const { localPath, allocateSize } = cacheFile;
    fs.removeSync(localPath);
    this.currentAllocateSize -= allocateSize;
    const index = this.cacheFileList.findIndex(item => item.url.replace(/\?[\s\S]*$/, '') === url.replace(/\?[\s\S]*$/, ''));
    this.cacheFileList.splice(index, 1);
  }
  getCacheFileLocalSize({ url }) {
    const cacheFile = this.getCacheFile({ url });
    if (!cacheFile) {
      return 0;
    }
    try {
      const { localPath } = cacheFile;
      return fs.statSync(localPath).size;
    } catch (err) {
      return 0;
    }
  }
  finishCacheFile({ url, force = false }) {
    return new Promise((resolve, reject) => {
      const cacheFile = this.getCacheFile({ url });
      if (!cacheFile) {
        resolve();
        return;
      }
      const { status, writeStream } = cacheFile;
      if (status === 'finish') {
        resolve();
        return;
      }
      this.updateCacheFile({
        url,
        status: 'finish',
        writeStream: null,
      });
      if (status === 'downloading' && force && writeStream) {
        writeStream.once('finish', resolve).once('error', reject);
        writeStream.end();
      } else {
        resolve();
        this.initFinish();
      }
    });
  }
  runTask() {
    while (this.getParallel() < this.maxParallel) {
      const cacheFile = this.getCacheFile({ status: 'waiting' });
      if (!cacheFile) {
        return;
      }
      const { url, totalSize } = cacheFile;
      if (totalSize <= 0) {
        this.removeCacheFile({ url });
        continue;
      }
      const allocateSize = Math.min(
        this.maxCacheSize - this.currentAllocateSize,
        totalSize,
      );
      if (allocateSize === 0) {
        return;
      }
      if (allocateSize < totalSize && allocateSize < this.minTruncateSize) {
        return;
      }
      this.currentAllocateSize += allocateSize;
      this.updateCacheFile({
        url,
        allocateSize,
        status: 'downloading',
      });
      this.downloadCacheFile({ url });
    }
  }
  downloadCacheFile({ url }) {
    const cacheFile = this.getCacheFile({ url });
    if (!cacheFile) {
      return;
    }
    const { allocateSize, localPath } = cacheFile;

    const writeStream = fs
      .createWriteStream(localPath)
      .on('error', () => {
        this.removeCacheFile({ url });
        process.nextTick(() => this.runTask());
      })
      .on('finish', async () => {
        await this.finishCacheFile({ url });
        process.nextTick(() => this.runTask());
      });

    this.updateCacheFile({
      url,
      writeStream: getRangeStreamFromUrl({
        url,
        start: 0,
        end: allocateSize,
      })
        .on('error', err => writeStream.emit('error', err))
        .pipe(writeStream),
    });
  }
  async getReadStream({ url }) {
    const cacheFile = this.getCacheFile({ url });
    if (!cacheFile) {
      return getRangeStreamFromUrl({ url });
    }
    await this.finishCacheFile({ url, force: true });
    const localSize = this.getCacheFileLocalSize({ url });
    const { totalSize, localPath } = this.getCacheFile({ url });

    if (localSize > totalSize) {
      throw new Error(`size error, localSize(${localSize}) is larger than totalSize(${totalSize})`);
    }

    if (localSize < totalSize && localSize < this.minTruncateSize) {
      this.removeCacheFile({ url });
      process.nextTick(() => this.runTask());
      return getRangeStreamFromUrl({ url });
    }

    const fileReadStream = fs.createReadStream(localPath).once('end', () => {
      this.removeCacheFile({ url });
      process.nextTick(() => this.runTask());
    });

    if (localSize === totalSize) {
      return fileReadStream;
    }

    return getMultipleReadStream({
      getNextStream: ({ index = 0 } = {}) => {
        if (index > 1) {
          return;
        }
        if (index === 0) {
          return {
            nextParams: {
              index: index + 1,
            },
            stream: fileReadStream,
          };
        }
        if (index === 1) {
          return {
            nextParams: {
              index: index + 1,
            },
            stream: getRangeStreamFromUrl({
              url,
              start: localSize,
              end: totalSize,
            }),
          };
        }
      },
    });
  }
  initFinish({ error = null, force = false, reason = '' } = {}) {
    if (!this.initCallback) {
      return;
    }
    if (force) {
      const { initCallback, initTimer } = this;
      this.initCallback = null;
      if (initTimer) {
        clearTimeout(initTimer);
      }
      initCallback(error);
      console.log(`file cache init is finished, reason: ${reason}`);
      return;
    }
    const allFinish = this.cacheFileList.every(item => item.status === 'finish');
    if (allFinish) {
      this.initFinish({
        force: true,
        reason: 'all file downloaded',
      });
      return;
    }
    const downloadSize = fastFolderSizeSync(this.cachePath);
    if (downloadSize >= this.initCacheSize) {
      this.initFinish({
        force: true,
        reason: `downloadSize(${downloadSize}) is larger than initCacheSize(${this.initCacheSize})`,
      });
      return;
    }
  }
  init({ fileList = [] }) {
    return new Promise(async (resolve, reject) => {
      try {
        this.initCallback = (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        };
        fs.emptyDirSync(this.cachePath);
        await promiseMapLimit({
          list: fileList,
          func: async ({ url, ...args }) => {
            const meta = await getMetaFromUrl(url);
            this.addCacheFile({
              url,
              totalSize: parseInt(meta['content-length'], 10),
              ...args,
            });
            process.nextTick(() => this.runTask());
          },
          limit: 20,
        });
        this.runTask();
        this.initTimer = setTimeout(() => {
          this.initFinish({
            force: true,
            reason: 'init timeout',
          });
        }, this.initDelay);
      } catch (error) {
        this.initFinish({
          error,
          force: true,
          reason: 'init error',
        });
      }
    });
  }
}

module.exports = FileCache;
