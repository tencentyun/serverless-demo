/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
const { Writable } = require('stream');

class QueueConsumerWriteStream extends Writable {
  constructor({ maxSize = 20, parallel = 5, ...args }, ...resArgs) {
    super(
      {
        objectMode: true,
        ...args,
      },
      ...resArgs,
    );
    Object.assign(this, {
      maxSize,
      parallel,
      tasks: [],
      runningTasks: [],
      hasWrited: false,
      writeCallback: null,
      finalCallback: null,
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
    if (this.tasks.length >= this.maxSize) {
      return;
    }
    this.onceCallback('writeCallback');
  }
  start() {
    while (this.runningTasks.length < this.parallel) {
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
  onTaskEnd({ uuid }) {
    try {
      const runningIndex = this.runningTasks.findIndex(item => item.uuid === uuid);
      const taskIndex = this.tasks.findIndex(item => item.uuid === uuid);
      this.runningTasks.splice(runningIndex, 1);
      this.tasks.splice(taskIndex, 1);
      if (this.writeCallback && this.tasks.length < this.maxSize) {
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
      if (method === 'writeCallback') {
        if (
          process.env.debugMode
          && process.env.debugMode.includes('QueueConsumerWriteStream')
        ) {
          console.log('QueueConsumerWriteStream writeCallback');
        }
      }
      if (method === 'finalCallback') {
        console.log('QueueConsumerWriteStream finalCallback');
        process.nextTick(async () => {
          try {
            await this._afterFinal();
          } catch (err) {}
        });
      }
    }
  }
  async _consume(params) {
    throw new Error('_consume must be implemented');
  }
  async _afterFinal() {}
  _write(params, encoding, callback) {
    if (
      process.env.debugMode
      && process.env.debugMode.includes('QueueConsumerWriteStream')
    ) {
      console.log('QueueConsumerWriteStream get writeCallback');
    }
    this.writeCallback = callback;
    this.hasWrited = true;
    this.pushTask(params);
  }
  async _final(callback) {
    console.log('QueueConsumerWriteStream get finalCallback');
    this.finalCallback = callback;
    if (!this.hasWrited || this.tasks.length === 0) {
      this.onceCallback('finalCallback');
    }
  }
}

module.exports = QueueConsumerWriteStream;
