const path = require('path');
const zlib = require('zlib');
const tar = require('tar-stream');
const EventEmitter = require('events');
const TrashWriteStream = require('./TrashWriteStream');
const { PassThrough } = require('stream');
const { streamPipelinePromise } = require('./utils');

class CosTGunzipFileTask {
  constructor({
    cosInstance,
    cosUpload,
    bucket,
    region,
    key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    maxTryTime = 30,
  }) {
    const extname = /\.tar.gz$/.test(key) ? '.tar.gz' : path.extname(key);
    const basename = path.basename(key, extname);
    const dirname = path.dirname(key);
    const extraPaths = [
      extraRootDir.toLowerCase().includes('dirname') ? dirname : '',
      extraRootDir.toLowerCase().includes('basename') ? basename : '',
    ].filter(Boolean);

    Object.assign(this, {
      cosInstance,
      cosUpload,
      bucket,
      region,
      key,
      targetBucket,
      targetRegion,
      targetPrefix: path.join(targetPrefix, ...extraPaths).replace(/\\/g, '/'),
      maxTryTime,
      results: [],
      passThrough: null,
      cancelError: null,
    });
  }
  async runTask() {
    for (let i = 0; i < this.maxTryTime; i++) {
      try {
        if (this.cancelError) {
          throw this.cancelError;
        }
        await this.runTaskOnce();
        break;
      } catch (error) {
        // if task is canceled or error cause by cancelError, do not retry
        if (this.cancelError) {
          break;
        }
      }
    }
    return this.results;
  }
  runTaskOnce() {
    return new Promise((resolve, reject) => {
      const emitter = new EventEmitter();
      emitter.once('resolve', resolve);
      emitter.once('reject', (error) => {
        // ensure results constain error
        if (this.results.filter(item => item.error).length === 0) {
          this.results.push({
            params: {},
            error,
          });
        }
        reject(error);
      });

      const { bucket, region, key } = this;
      this.results = this.results.filter(item => !item.error);

      const decompressStream = zlib.createGunzip();

      let index = -1;
      let sourceEnded = false;
      let lastEntryTimer;
      this.cosInstance
        .getObjectStream({
          Bucket: bucket,
          Region: region,
          Key: key,
        })
        .on('error', error => emitter.emit('reject', error))
        .on('end', () => (sourceEnded = true))
        .pipe(decompressStream, { end: false })
        .on('error', error => emitter.emit('reject', error))
        .pipe(tar.extract())
        .on('entry', async (header, stream, next) => {
          index += 1;
          const params = {
            name: header.name,
            size: header.size,
          };
          try {
            if (lastEntryTimer !== undefined) {
              clearTimeout(lastEntryTimer);
            }
            if (this.cancelError) {
              throw this.cancelError;
            }
            if (this.results[index]) {
              await this.skipOneTask({ stream });
              // to avoid Zlib Gunzip Bug, try to end the decompressStream after last entry is done
              // 1000ms delay is unnecessary, you can set it to 0, just in case of some unexpected problem
              if (sourceEnded) {
                lastEntryTimer = setTimeout(() => decompressStream.end(), 1000);
              }
              next();
            } else {
              const result = await this.runOneTask({ header, stream });
              this.results.push({
                params,
                result,
              });
              // to avoid Zlib Gunzip Bug, try to end the decompressStream after last entry is done
              // 1000ms delay is unnecessary, you can set it to 0, just in case of some unexpected problem
              if (sourceEnded) {
                lastEntryTimer = setTimeout(() => decompressStream.end(), 1000);
              }
              next();
            }
          } catch (error) {
            this.results.push({
              params,
              error,
            });
            next(error);
          }
        })
        .on('error', error => emitter.emit('reject', error))
        .on('finish', () => emitter.emit('resolve', this.results));
    });
  }
  async skipOneTask({ stream }) {
    const result = await streamPipelinePromise([
      stream,
      new TrashWriteStream(),
    ]);
    return result;
  }
  async runOneTask({ header, stream }) {
    const result = await this.uploadToCos({
      targetBucket: this.targetBucket,
      targetRegion: this.targetRegion,
      targetKey: path.join(this.targetPrefix, header.name).replace(/\\/g, '/'),
      stream,
      header,
    });
    return result;
  }
  async uploadToCos({ targetBucket, targetRegion, targetKey, stream, header }) {
    this.passThrough = new PassThrough();
    const result = await Promise.all([
      this.cosUpload.runTask({
        object: {
          Bucket: targetBucket,
          Region: targetRegion,
          Key: targetKey,
          ContentLength: header.size,
        },
        getReadStream: () => this.passThrough,
      }),
      streamPipelinePromise([stream, this.passThrough]),
    ]);
    this.passThrough = null;
    return result[0];
  }
  cancelTask(error = new Error('task is canceled')) {
    this.cancelError = error;
    if (this.passThrough) {
      this.passThrough.emit('error', error);
    }
  }
}

module.exports = CosTGunzipFileTask;
