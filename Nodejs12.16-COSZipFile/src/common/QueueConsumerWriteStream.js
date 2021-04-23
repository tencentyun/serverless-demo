/* eslint-disable no-param-reassign */
const { Writable } = require('stream');

class QueueConsumerWriteStream extends Writable {
  constructor(
    {
      maxSize = 10,
      parallel = 3,
      consumer,
      beforePushTask = item => item,
      beforeFinal = () => null,
      ...args
    },
    ...resArgs
  ) {
    if (!(consumer && typeof consumer === 'function')) {
      throw new Error('consumer should be a function');
    }
    super(args, ...resArgs);
    Object.assign(this, {
      maxSize,
      parallel,
      consumer,
      beforePushTask,
      beforeFinal,
      tasks: [],
      runningTasks: [],
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
      await this.consumer(task.params);
      this.onTaskEnd(task);
      process.nextTick(() => this.start());
    } catch (err) {
      this.emit('error', err);
    }
  }
  async onTaskEnd({ uuid }) {
    try {
      const runningIndex = this.runningTasks.findIndex(item => item.uuid === uuid);
      const taskIndex = this.tasks.findIndex(item => item.uuid === uuid);
      this.runningTasks.splice(runningIndex, 1);
      this.tasks.splice(taskIndex, 1);
      if (this.writeCallback && this.tasks.length < this.maxSize) {
        this.onceCallback('writeCallback');
      }
      if (this.finalCallback && this.tasks.length === 0) {
        await this.beforeFinal();
        this.onceCallback('finalCallback');
      }
    } catch (err) {
      this.emit('error', err);
    }
  }
  onceCallback(method) {
    const callback = this[method];
    this[method] = null;
    callback();
  }
  _write(chunk, encoding, callback) {
    const params = this.beforePushTask({ chunk, encoding });
    this.writeCallback = callback;
    this.pushTask(params);
  }
  _final(callback) {
    this.finalCallback = callback;
  }
}

module.exports = QueueConsumerWriteStream;
