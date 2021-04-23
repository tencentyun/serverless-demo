/* eslint-disable no-param-reassign */
class QueueConsumer {
  constructor({ parallel = 1, consumer, callback = () => null }) {
    if (!(consumer && typeof consumer === 'function')) {
      throw new Error('consumer should be a function');
    }
    Object.assign(this, {
      parallel,
      consumer,
      callback,
      tasks: [],
      runningTasks: [],
    });
  }
  getUUID() {
    return `${Date.now()}_${Math.random() * 1000}`;
  }
  pushTask({ uuid = -1, list }) {
    const tasks = list.map(params => ({
      uuid: this.getUUID(),
      status: 'waiting',
      params,
    }));
    const index = this.tasks.findIndex(item => item.uuid === uuid);
    if (index === -1 || index === this.tasks.length - 1) {
      this.tasks.push(...tasks);
    } else {
      this.tasks.splice(index + 1, 0, ...tasks);
    }
    process.nextTick(() => this.start());
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
      await this.consumer(task);
      this.onTaskEnd(task);
      process.nextTick(() => this.start());
    } catch (err) {
      this.callback(err);
    }
  }
  async onTaskEnd({ uuid }) {
    const runningIndex = this.runningTasks.findIndex(item => item.uuid === uuid);
    const taskIndex = this.tasks.findIndex(item => item.uuid === uuid);
    this.runningTasks.splice(runningIndex, 1);
    this.tasks.splice(taskIndex, 1);
    if (this.tasks.length === 0) {
      this.callback();
    }
  }
}

module.exports = QueueConsumer;
