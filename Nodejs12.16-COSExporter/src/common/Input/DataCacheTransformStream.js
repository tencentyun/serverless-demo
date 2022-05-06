/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const { Duplex } = require('stream');

class DataCacheTransformStream extends Duplex {
  constructor({ maxCacheSize = 0, ...args }, ...resArgs) {
    super(
      {
        readableObjectMode: true,
        writableObjectMode: true,
        ...args,
      },
      ...resArgs,
    );
    this._readableState.sync = false;
    Object.assign(this, {
      maxCacheSize,
      currentCacheSize: 0,
      flowing: true,
      tasks: [],
      runningTasks: [],
      hasWrited: false,
      writeCallback: null,
      finalCallback: null,
      consumeResolve: null,
      consumeReject: null,
    });
  }
  getUUID() {
    return `${Date.now()}_${Math.random() * 1000}`;
  }
  pushTask(params) {
    this.tasks.push({
      uuid: this.getUUID(),
      status: 'waiting',
      params,
    });
    process.nextTick(() => this.start());
    this.currentCacheSize += params.length;
    if (this.currentCacheSize >= this.maxCacheSize) {
      return;
    }
    this.onceCallback('writeCallback');
  }
  start() {
    while (this.runningTasks.length === 0) {
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
      this.runningTasks.push(task);
      await this._consume(task.params);
      this.onTaskEnd(task);
      process.nextTick(() => this.start());
    } catch (err) {
      this.emit('error', err);
    }
  }
  onTaskEnd({ uuid, params }) {
    try {
      this.currentCacheSize -= params.length;
      const runningIndex = this.runningTasks.findIndex(item => item.uuid === uuid);
      const taskIndex = this.tasks.findIndex(item => item.uuid === uuid);
      this.runningTasks.splice(runningIndex, 1);
      this.tasks.splice(taskIndex, 1);
      if (this.writeCallback && this.currentCacheSize < this.maxCacheSize) {
        this.onceCallback('writeCallback');
      }
      if (this.finalCallback && this.tasks.length === 0) {
        this.onceCallback('finalCallback');
      }
    } catch (err) {
      this.emit('error', err);
    }
  }
  onceCallback(method, ...args) {
    const callback = this[method];
    this[method] = null;
    if (callback) {
      callback(...args);
      if (method === 'finalCallback') {
        this.push(null);
        console.log('DataCacheTransformStream finalCallback');
      }
    }
  }
  _consume(params) {
    return new Promise((resolve, reject) => {
      this.flowing = this.push(params);
      if (this.flowing) {
        resolve();
      } else {
        this.consumeResolve = resolve;
        this.consumeReject = reject;
      }
    });
  }
  _read() {
    this.flowing = true;
    if (this.consumeResolve) {
      const { consumeResolve } = this;
      this.consumeResolve = null;
      this.consumeReject = null;
      consumeResolve();
    }
  }
  _write(params, encoding, callback) {
    this.writeCallback = callback;
    this.hasWrited = true;
    this.pushTask(params);
  }
  _final(callback) {
    console.log('DataCacheTransformStream get finalCallback');
    this.finalCallback = callback;
    if (!this.hasWrited || this.tasks.length === 0) {
      this.onceCallback('finalCallback');
    }
  }
}

module.exports = DataCacheTransformStream;
