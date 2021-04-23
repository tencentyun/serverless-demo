const yazl = require('yazl');
const { PassThrough } = require('stream');
const { getRangeStreamFromUrl } = require('./utils');
const CosMultiUpload = require('./CosMultiUpload');
const QueueConsumer = require('./QueueConsumer');
const { parseUrl, tryAddCosSignature } = require('./utils');
class CosZipFileTask {
  constructor({
    cosSdkInstance,
    sourceList,
    targetBucket,
    targetRegion,
    targetKey,
    flatten,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      sourceList,
      targetBucket,
      targetRegion,
      targetKey,
      flatten,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      result = await this.runTaskInner();
    } catch (err) {
      error = err;
    }
    return {
      params: {
        sourceList: this.sourceList,
        targetBucket: this.targetBucket,
        targetRegion: this.targetRegion,
        targetKey: this.targetKey,
      },
      result,
      error,
    };
  }
  runTaskInner() {
    return new Promise(async (resolve, reject) => {
      try {
        this.zipFile = new yazl.ZipFile();
        const cosMultiUpload = new CosMultiUpload({
          cosSdkInstance: this.cosSdkInstance,
          object: {
            Bucket: this.targetBucket,
            Region: this.targetRegion,
            Key: this.targetKey,
          },
          defaultChunkSize: 8 * 1024 * 1024,
        });
        const stream = await cosMultiUpload.getStream();
        this.zipFile.outputStream
          .once('error', err => stream.emit('error', err))
          .pipe(stream)
          .once('error', reject)
          .once('success', resolve);
        const queueConsumer = new QueueConsumer({
          consumer: async ({ uuid, params }) => {
            const { key } = parseUrl(params);
            if (/\/$/.test(key) && !params.isFile) {
              const list = await this.getSubFileList(params);
              queueConsumer.pushTask({
                uuid,
                list,
              });
            } else {
              await this.processOneSubFile(params);
            }
          },
          callback: (err) => {
            if (err) {
              stream.emit('error', err);
            } else {
              this.zipFile.end();
            }
          },
        });
        queueConsumer.pushTask({ list: this.sourceList });
      } catch (err) {
        reject(err);
      }
    });
  }
  processOneSubFile({ url, renamePath }) {
    return new Promise((resolve, reject) => {
      const { key: originKey } = parseUrl({ url });
      const originName = originKey.split('/').pop();
      let key = '';
      if (renamePath !== null && renamePath !== undefined) {
        key = renamePath;
      } else if (this.flatten) {
        key = originName;
      } else {
        key = originKey;
      }
      if (key === '') {
        resolve();
        return;
      }
      if (/\/$/.test(key)) {
        this.zipFile.addEmptyDirectory(key);
        resolve();
        return;
      }
      const passThrough = new PassThrough();
      passThrough.on('error', reject).on('finish', resolve);
      this.zipFile.addReadStream(passThrough, key, { compress: true });

      const signUrl = tryAddCosSignature({
        cosSdkInstance: this.cosSdkInstance,
        url,
      });
      getRangeStreamFromUrl({ url: signUrl })
        .on('error', err => passThrough.emit('error', err))
        .pipe(passThrough);
    });
  }
  async getSubFileList({ url, renamePath, marker, keyMarker }) {
    const { bucket, region, key } = parseUrl({ url });
    const {
      Contents = [],
      NextMarker,
      NextKeyMarker,
      IsTruncated,
    } = await this.cosSdkInstance.getBucket({
      Bucket: bucket,
      Region: region,
      Prefix: key,
      Marker: marker,
      KeyMarker: keyMarker,
      MaxKeys: 1000,
    });
    const fileTasks = Contents.map(({ Key }) => {
      const suffix = Key.slice(key.length);
      return {
        url: this.cosSdkInstance.getObjectUrl({
          Bucket: bucket,
          Region: region,
          Key,
          Sign: false,
        }),
        renamePath:
          renamePath !== null && renamePath !== undefined
            ? `${renamePath}${suffix}`
            : null,
        isFile: true,
      };
    });
    const dirTasks = {
      url,
      renamePath,
      marker: NextMarker,
      keyMarker: NextKeyMarker,
    };
    return IsTruncated === 'true' ? [...fileTasks, dirTasks] : fileTasks;
  }
}

module.exports = CosZipFileTask;
