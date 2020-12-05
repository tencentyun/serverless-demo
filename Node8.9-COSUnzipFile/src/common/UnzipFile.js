const yauzl = require('yauzl')
const CosRandomAccessReader = require('./CosRandomAccessReader')
const { extend } = require('lodash')
const { bufferToString, appendFunction } = require('./utils')

class UnzipFile {
  constructor({
    cosInstance,
    Bucket,
    Region,
    Key,
    zipFile = null,
    maxTryTime = 3
  }) {
    extend(this, {
      cosInstance,
      Bucket,
      Region,
      Key,
      zipFile,
      maxTryTime
    })

    appendFunction({
      target: yauzl,
      keys: ['fromRandomAccessReader'],
      maxTryTime
    })
  }

  async init({
    lazyEntries = true,
    autoClose = false,
    decodeStrings = false
  } = {}) {
    const { cosInstance, Bucket, Region, Key, maxTryTime } = this
  
    const reader = new CosRandomAccessReader({ cosInstance, Bucket, Region, Key, maxTryTime })

    const totalSize = await reader.getTotalSize()

    try {
      this.zipFile = await yauzl.fromRandomAccessReaderRetryPromise(reader, totalSize, {
        lazyEntries,
        autoClose,
        decodeStrings
      })
      appendFunction({
        target: this.zipFile,
        keys: ['openReadStream'],
        maxTryTime: 1
      })
    } catch (error) {
      throw {
        error,
        trace: 'UnzipFile.init.yauzl.fromRandomAccessReaderRetryPromise'
      }
    }
  }

  getEntries() {
    return new Promise((resolve, reject) => {
      let tryTime = 0, entries = []

      this.zipFile.on('entry', entry => {
        tryTime = 0
        entry.fileNameStr = bufferToString(entry.fileName)
        entries.push(entry)
        if (this.zipFile.isOpen) {
          this.zipFile.readEntry()
        } else {
          reject({ isOpen: false })
        }
      })

      this.zipFile.on('end', () => {
        this.zipFile.removeAllListeners('error')
        resolve(entries)
      })

      this.zipFile.on('error', err => {
        tryTime++
        console.log(`on entry error, index: ${entries.length}, tryTime: ${tryTime}`)
        if (tryTime >= this.maxTryTime) {
          reject(err)
        } else {
          this.zipFile.readEntry()
        }
      })

      this.zipFile.readEntry()
    })
  }

  async getStream(entry) {
    if (/\/$/.test(entry.fileNameStr)) {
      return Buffer.from('')
    }

    if (!this.zipFile.isOpen) {
      throw { isOpen: false }
    }

    const stream = await this.zipFile.openReadStreamPromise(entry)

    if (!this.zipFile.isOpen) {
      throw { isOpen: false }
    }

    return stream
  }

  close() {
    if (this.zipFile && this.zipFile.isOpen) {
      this.zipFile.removeAllListeners('error')
      this.zipFile.close()
    }
  }
}

module.exports = UnzipFile