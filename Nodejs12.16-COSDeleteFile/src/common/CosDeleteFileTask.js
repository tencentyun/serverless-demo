/* eslint-disable prefer-const */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const CosDeleteTaskQueue = require('./CosDeleteTaskQueue');
const { getNotNullData } = require('./utils');

class CosDeleteFileTask {
  constructor({ cosSdkInstance, sourceList, triggerType, avoidLoopRisk }) {
    Object.assign(this, {
      cosSdkInstance,
      sourceList: sourceList.map(item => ({
        ...item,
      })),
      triggerType,
      avoidLoopRisk,
      taskQueue: null,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      this.taskQueue = new CosDeleteTaskQueue({
        cosSdkInstance: this.cosSdkInstance,
        tasks: this.sourceList,
      });
      result = await this.taskQueue.startTasks();
    } catch (err) {
      error = err;
    } finally {
      delete this.taskQueue;
    }
    return {
      params: getNotNullData({
        sourceListLength: this.sourceList.length,
        triggerType: this.triggerType,
        avoidLoopRisk: this.avoidLoopRisk,
      }),
      result,
      error,
    };
  }
  async cancelTask(error) {
    if (this.taskQueue) {
      try {
        await this.taskQueue.cancelTasks(error);
      } catch (err) {}
    }
  }
}

module.exports = CosDeleteFileTask;
