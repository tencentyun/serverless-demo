/* eslint-disable prefer-destructuring */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */

class TaskQueue {
  constructor({
    parallel = 1,
    failStop = true,
    lastResult,
    processTask,
    processResult,
    tasks = [],
  }) {
    if (typeof processTask === 'function') {
      this._processTask = processTask;
    }
    if (typeof processResult === 'function') {
      this._processResult = processResult;
    }
    Object.assign(this, {
      parallel,
      failStop,
      status: 'waiting',
      tasks: [],
      runningTasks: [],
      lastResult,
      resolve: null,
      reject: null,
    });
    this.addTasks({ tasks });
  }
  getUUID() {
    return `${Date.now()}_${Math.random() * 1000}`;
  }
  addTasks({ uuid = -1, tasks = [] }) {
    tasks = tasks.map(params => ({
      uuid: this.getUUID(),
      status: 'waiting',
      params,
    }));
    const index = this.tasks.findIndex(item => item.uuid === uuid);
    if (index === -1 || index === this.tasks.length - 1) {
      tasks.forEach(item => this.tasks.push(item));
    } else {
      if (tasks.length < 5000) {
        this.tasks.splice(index + 1, 0, ...tasks);
      } else {
        const left = this.tasks.slice(0, index + 1);
        const right = this.tasks.slice(index + 1);
        this.tasks = left.concat(tasks).concat(right);
      }
    }
  }
  runTasks() {
    while (
      this.status === 'running'
      && this.tasks.length > 0
      && this.runningTasks.length < this.parallel
    ) {
      const task = this.tasks.find(item => item.status === 'waiting');
      if (task) {
        this.runTask(task);
      } else {
        break;
      }
    }
  }
  async runTask({ uuid }) {
    let result;
    let error;
    try {
      const task = this.tasks.find(item => item.uuid === uuid);
      task.status = 'running';
      this.runningTasks.push(task);
      result = await this._processTask(task);
    } catch (err) {
      error = err;
    }
    await this.onTaskCallback({ uuid, result, error });
  }
  async onTaskCallback({ uuid, result, error }) {
    const task = this.tasks.find(item => item.uuid === uuid);
    if (!task) {
      return;
    }
    Object.assign(task, {
      result,
      error,
      status: error ? 'fail' : 'success',
    });
    if (task.status === 'fail' && this.failStop) {
      this.status = 'fail';
      this._reject(task);
      return;
    }
    this.lastResult = await this._processResult({
      lastResult: this.lastResult,
      currentTask: task,
    });
    const taskIndex = this.tasks.findIndex(item => item.uuid === uuid);
    const runningTaskIndex = this.runningTasks.findIndex(item => item.uuid === uuid);
    if (taskIndex > -1) {
      this.tasks.splice(taskIndex, 1);
    }
    if (runningTaskIndex > -1) {
      this.runningTasks.splice(runningTaskIndex, 1);
    }
    if (this.tasks.length > 0) {
      process.nextTick(() => this.runTasks());
    } else {
      this._resolve(this.lastResult);
    }
  }
  startTasks() {
    return new Promise((resolve, reject) => {
      Object.assign(this, {
        status: 'running',
        resolve,
        reject,
      });
      this.runTasks();
    });
  }
  async cancelTasks(error = new Error('TaskQueue canceled')) {
    if (this.status === 'canceled') {
      return;
    }
    this.status = 'canceled';
    while (this.runningTasks.length) {
      const task = this.runningTasks[0];
      const { uuid } = task;
      await this.onTaskCallback({ uuid, error });
      await this._cancelTask(task);
    }
    if (this.failStop) {
      return;
    }
    this.tasks = [];
    this.runningTasks = [];
    this._reject(this.lastResult);
  }
  async _processTask() {
    throw new Error('_processTask is not implemented');
  }
  async _cancelTask() {
    return null;
  }
  async _processResult() {
    return null;
  }
  _resolve(...args) {
    if (this.resolve) {
      const resolve = this.resolve;
      this.resolve = null;
      resolve(...args);
    }
  }
  _reject(...args) {
    if (this.reject) {
      const reject = this.reject;
      this.reject = null;
      reject(...args);
    }
  }
}

module.exports = TaskQueue;
