const path = require('path')
const TaskManager = require('./TaskManager')
const UnzipFile = require('./UnzipFile')
const { parseFileName, getBatchLimit, appendFunction } = require('./utils')
const { extend } = require('lodash')

const GB = 1024 * 1024 * 1024
const PUT_OBJECT_LIMIT = 5 * GB

class UnzipTask {
  constructor({
    cosInstance,
    totalMem,
    Bucket,
    Region,
    Key,
    targetBucket,
    targetRegion,
    targetPrefix,
    extraRootDir,
    maxTryTime = 3
  }) {
    const { basename, extname } = parseFileName(Key)
    extend(this, {
      cosInstance,
      totalMem,
      Bucket,
      Region,
      Key,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      maxTryTime,
      basename,
      extname
    })

    appendFunction({
      target: this,
      keys: ['unzipOneTask'],
      promisify: false,
      maxTryTime
    })
  }

  async initTaskManager() {
    if (this.taskManager && this.unzipFile) {
      return
    }

    const { cosInstance, totalMem, Bucket, Region, Key, maxTryTime } = this

    const batchLimit = getBatchLimit({
      runtimeBuffer: 10 * 1024 * 1024,
      reserveRate: 0.2,
      totalMem
    })

    const unzipFile = this.unzipFile = new UnzipFile({ cosInstance, Bucket, Region, Key, maxTryTime })
  
    await unzipFile.init()

    let entries, list

    try {
      entries = await unzipFile.getEntries()
      console.log(`zip file entries count is ${entries.length}`)
      list = entries.map((entry, index) => ({ entry, index }))
    } catch (error) {
      throw {
        error,
        trace: 'UnzipTask.unzipFile.getEntries'
      }
    }

    this.taskManager = new TaskManager({
      batchLimit,
      list,
      onStart: async ({ task, onFinish }) => {
        if (task.entry.uncompressedSize > PUT_OBJECT_LIMIT) {
          onFinish({ error: `single sub file can not larger than ${PUT_OBJECT_LIMIT / GB} GB` })
          return
        }
        try {
          const res = await this.unzipOneTaskRetry({ task })
          onFinish(null, res)
        } catch (error) {
          console.log(`fileIndex: ${task.index}`, task.entry, error)
          onFinish(error)
        }
      },
      onCancel(task) {
      }
    })
  }

  async unzipOneTask({ task }) {
    const {
      cosInstance,
      targetBucket,
      targetRegion,
      targetPrefix,
      extraRootDir,
      basename,
      unzipFile
    } = this

    let Key = path.join(targetPrefix, task.entry.fileNameStr).replace(/\\/g, '\/')

    if (extraRootDir === 'fileBaseName') {
      Key = path.join(targetPrefix, basename, task.entry.fileNameStr).replace(/\\/g, '\/')
    }

    try {
      const Body = await unzipFile.getStream(task.entry)
      const res = await cosInstance.putObjectPromise({
        Bucket: targetBucket,
        Region: targetRegion,
        Key,
        Body
      })
      return res
    } catch (error) {
      throw {
        error,
        Key,
        trace: 'UnzipTask.unzipFile.cosInstance.unzipOneTask'
      }
    }
  }

  async run() {
    const { Key, extname } = this
    if (extname !== '.zip') {
      throw { error: `${Key} is not a *.zip file` }
    }
    await this.initTaskManager()
    const result = await this.taskManager.startPromise()
    return result
  }

  cancel() {
    this.taskManager && this.taskManager.cancel()
    this.unzipFile && this.unzipFile.close()
  }
}

module.exports = UnzipTask