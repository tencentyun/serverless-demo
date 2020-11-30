const request = require('request')
const fs = require('fs')
const FdSlicer = require('fd-slicer')
const { RandomAccessReader } = require('yauzl')
const { extend } = require('lodash')
const { appendFunction } = require('./utils')

class CosRandomAccessReader extends RandomAccessReader {
  constructor({
    cosInstance,
    Bucket,
    Region,
    Key,
    Expires = 900 * 1000,
    Sign = true,
    requestTimeout = 900 * 1000,
    maxTryTime = 3,

    totalSize = 0,
    localOffset = 0,
    localFdSlicer = null,
    localPath = '/tmp/temp.zip',
    localSizeLimit = 450 * 1024 * 1024
  }) {
    super()
    const objectUrl = cosInstance.getObjectUrl({ Bucket, Region, Key, Expires, Sign })
    extend(this, {
      cosInstance,
      Bucket,
      Region,
      Key,
      objectUrl,
      requestTimeout,
      maxTryTime,

      totalSize,
      localOffset,
      localFdSlicer,
      localPath,
      localSizeLimit
    })
  
    appendFunction({
      target: this,
      keys: ['downloadFile', 'getFdSlicer'],
      promisify: false,
      maxTryTime
    })
  }

  async getTotalSize() {
    const {
      cosInstance,
      Bucket,
      Region,
      Key,
      localPath: filePath,
      localSizeLimit
    } = this

    try {
      const { headers } = await cosInstance.headObjectRetryPromise({ Bucket, Region, Key })
      this.totalSize = headers['content-length'] * 1
      console.log(`whole zip file size is ${this.totalSize}`)
    } catch (error) {
      throw {
        error,
        trace: 'CosRandomAccessReader.cosInstance.headObjectRetryPromise'
      }
    }

    this.localOffset = Math.max(this.totalSize - localSizeLimit, 0)

    await this.downloadFileRetry({
      filePath,
      headers: this.totalSize === 0 ? {} : { Range: `bytes=${this.localOffset}-` }
    })

    this.localFdSlicer = await this.getFdSlicerRetry({ filePath })

    console.log(`zip file is downloaded, total size is ${this.totalSize}, downloaded size is ${this.totalSize - this.localOffset}, offset is ${this.localOffset}`)

    return this.totalSize
  }

  async downloadFile({
    filePath,
    headers = {}
  }) {
    const { cosInstance, Bucket, Region, Key } = this
    try {
      const outputStream = fs.createWriteStream(filePath)

      outputStream.writeFinish = () => {
        return new Promise((resolve, reject) => {
          outputStream.once('finish', resolve)
          outputStream.once('error', reject)
        })
      }

      await Promise.all([
        cosInstance.getObjectPromise({
          Bucket,
          Region,
          Key,
          Headers: headers,
          Output: outputStream
        }),
        outputStream.writeFinish()
      ])
    } catch (error) {
      throw {
        error,
        trace: 'CosRandomAccessReader.cosInstance.getObjectPromise'
      }
    }
  }

  /**
   * get file fd and init fd slicer
   */
  getFdSlicer({ filePath }) {
    return new Promise((resolve, reject) => {
      fs.open(filePath, 'r', (err, fd) => {
        try {
          if (err) {
            throw err
          }
          resolve(FdSlicer.createFromFd(fd))
        } catch (error) {
          reject({
            error,
            trace: 'CosRandomAccessReader.getFdSlicer'
          })
        }
      })
    })
  }

  /**
   * if the wanted part is downloaded, read it from disk
   * else read it from request
   */
  getRangeStream({ start, end }) {
    if (this.localFdSlicer && start >= this.localOffset) {
      return this.localFdSlicer.createReadStream({
        start: start - this.localOffset,
        end: end - this.localOffset
      })
    } else {
      return request({
        url: this.objectUrl,
        timeout: this.requestTimeout,
        headers: {
          Range: `bytes=${start}-${end - 1}`
        }
      })
    }
  }

  _readStreamForRange(start, end) {
    return this.getRangeStream({ start, end })
  }
}

module.exports = CosRandomAccessReader