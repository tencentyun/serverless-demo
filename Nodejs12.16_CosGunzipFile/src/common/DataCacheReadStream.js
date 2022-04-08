/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const { Readable } = require('stream');
const { readStreamToBuffer, getUUID } = require('./utils');

class DataCacheReadStream extends Readable {
  constructor(
    {
      totalSize = 0,
      blockSize = 0,
      maxTaskSize = 10,
      getRangeReadStream,
      ...args
    },
    ...resArgs
  ) {
    super(args, ...resArgs);
    if (typeof getRangeReadStream === 'function') {
      this._getRangeReadStream = getRangeReadStream;
    }
    Object.assign(this, {
      totalSize,
      blockSize,
      maxTaskSize,
      flowing: true,
      tasks: [],
      currentTask: null,
      hasData: false,
      readDataOffset: 0,
      readDataOnEndCallback: null,
      pushDataToTasksCallback: null,
      processCurrentTaskBufferOffset: 0,
      processCurrentTaskCallback: null,
    });
    process.nextTick(() => this.readData());
    this.on('error', () => this.clear());
  }
  onceCallback(method, ...args) {
    const callback = this[method];
    this[method] = null;
    if (callback) {
      callback(...args);
      if (method === 'readDataOnEndCallback') {
        this.push(null);
        console.log('DataCacheReadStream readDataOnEndCallback');
      }
    }
  }
  /**
   * Read data and push it into tasks
   * 1. try to read data from _getRangeReadStream, update readDataOffset
   * 2. push data into tasks, waiting for process
   * 3. if readDataOffset is equal to totalSize, exec readDataOnEnd
   */
  async readData() {
    try {
      if (this.readDataOffset === this.totalSize) {
        if (!this.readDataOnEndCallback) {
          this.readDataOnEnd(() => this.clear());
        }
        return;
      }
      const start = this.readDataOffset;
      const end = Math.min(
        this.readDataOffset + this.blockSize,
        this.totalSize,
      );
      const readStream = await this._getRangeReadStream({ start, end });
      const buffer = await readStreamToBuffer(readStream);
      this.readDataOffset = end;
      this.pushDataToTasks(buffer, () => this.readData());
    } catch (err) {
      this.emit('error', err);
    }
  }
  async _getRangeReadStream({ start, end }) {
    throw new Error('_getRangeReadStream must be implemented');
  }
  pushDataToTasks(buffer, callback) {
    this.pushDataToTasksCallback = callback;
    this.hasData = true;
    this.pushTask(buffer);
  }
  pushTask(buffer) {
    this.tasks.push({
      uuid: getUUID(),
      status: 'waiting',
      buffer,
    });
    process.nextTick(() => this.runTasks());
    if (this.tasks.length >= this.maxTaskSize) {
      return;
    }
    this.onceCallback('pushDataToTasksCallback');
  }
  readDataOnEnd(callback) {
    console.log('DataCacheReadStream get readDataOnEndCallback');
    this.readDataOnEndCallback = callback;
    if (!this.hasData || this.tasks.length === 0) {
      this.onceCallback('readDataOnEndCallback');
    }
  }
  clear() {
    Object.assign(this, {
      tasks: [],
      currentTask: null,
      readDataOnEndCallback: null,
      pushDataToTasksCallback: null,
      processCurrentTaskCallback: null,
    });
  }
  /**
   * Run tasks, process task sequentially
   * 1. find a waiting task in tasks
   * 2. set currentTask
   * 3. process currentTask
   */
  runTasks() {
    while (!this.currentTask) {
      const res = this.runOneTask();
      if (!res) {
        break;
      }
    }
  }
  runOneTask() {
    const task = this.tasks.find(item => item.status === 'waiting');
    if (!task) {
      return false;
    }
    this.onTaskStart(task);
    return true;
  }
  async onTaskStart(task) {
    try {
      task.status = 'running';
      this.currentTask = task;
      await this.processCurrentTask();
      this.onTaskEnd(task);
      process.nextTick(() => this.runTasks());
    } catch (err) {
      this.emit('error', err);
    }
  }
  onTaskEnd({ uuid }) {
    try {
      const taskIndex = this.tasks.findIndex(item => item.uuid === uuid);
      this.tasks.splice(taskIndex, 1);
      this.currentTask = null;
      if (
        this.pushDataToTasksCallback
        && this.tasks.length < this.maxTaskSize
      ) {
        this.onceCallback('pushDataToTasksCallback');
      }
      if (this.readDataOnEndCallback && this.tasks.length === 0) {
        this.onceCallback('readDataOnEndCallback');
      }
    } catch (err) {
      this.emit('error', err);
    }
  }
  /**
   * Process currentTask
   * 1. extract data chunk from currentTask's buffer
   * 2. push data chunk to downstream gracefully
   */
  processCurrentTask() {
    return new Promise((resolve, reject) => {
      Object.assign(this, {
        processCurrentTaskBufferOffset: 0,
        processCurrentTaskCallback: (err, data) => {
          if (err) {
            reject(err);
          } else {
            resolve(data);
          }
        },
      });
      this.consumeCurrentTaskBuffer();
    });
  }
  consumeCurrentTaskBuffer() {
    try {
      const highWaterMark = this._readableState.highWaterMark;
      while (true) {
        if (
          this.processCurrentTaskBufferOffset >= this.currentTask.buffer.length
        ) {
          break;
        }
        if (!this.flowing) {
          return;
        }
        const start = this.processCurrentTaskBufferOffset;
        const end = Math.min(
          this.processCurrentTaskBufferOffset + highWaterMark,
          this.currentTask.buffer.length,
        );
        const buffer = this.currentTask.buffer.slice(start, end);
        this.flowing = this.push(buffer);
        this.processCurrentTaskBufferOffset = end;
      }
      this.onceCallback('processCurrentTaskCallback');
    } catch (err) {
      this.onceCallback('processCurrentTaskCallback', err);
    }
  }
  _read() {
    if (!this.flowing) {
      this.flowing = true;
      if (this.processCurrentTaskCallback) {
        this.consumeCurrentTaskBuffer();
      }
    }
  }
}

module.exports = DataCacheReadStream;
