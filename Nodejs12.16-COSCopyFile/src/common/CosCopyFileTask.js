/* eslint-disable prefer-const */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
const CosCopyTaskQueue = require('./CosCopyTaskQueue');
const { getNotNullData } = require('./utils');

class CosCopyFileTask {
  constructor({
    cosSdkInstance,
    sourceList,
    relativePrefix,
    targetBucket,
    targetRegion,
    targetKeyTemplate,
    setHeaders,
    setAcls,
    setTags,
    deleteSourceKey,
    triggerType,
    avoidLoopRisk,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      sourceList: sourceList.map(item => ({
        relativePrefix,
        targetBucket,
        targetRegion,
        targetKeyTemplate,
        setHeaders,
        setAcls,
        setTags,
        deleteSourceKey,
        ...item,
      })),
      relativePrefix,
      targetBucket,
      targetRegion,
      targetKeyTemplate,
      setHeaders,
      setAcls,
      setTags,
      deleteSourceKey,
      triggerType,
      avoidLoopRisk,
      taskQueue: null,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      this.taskQueue = new CosCopyTaskQueue({
        cosSdkInstance: this.cosSdkInstance,
        tasks: this.sourceList,
        interceptor: async ({ event, params, sourceHeaders }) => {
          if (event !== 'beforeCopy') {
            return {
              params,
            };
          }
          if (
            this.avoidLoopRisk
            && sourceHeaders
            && sourceHeaders['x-cos-meta-scf-cos-copy-file'] === 'true'
          ) {
            console.log('this cos object is a scf cos copy file result, to avoid loop trigger, we skip it');
            return {
              result:
                'this cos object is a scf cos copy file result, to avoid loop trigger, we skip it',
            };
          }
          params.Headers['x-cos-meta-scf-cos-copy-file'] = 'true';
          if (this.triggerType === 'cosWorkflow') {
            params.Headers['x-cos-meta-source'] = 'cos-data-process';
          }
          return {
            params,
          };
        },
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
        relativePrefix: this.relativePrefix,
        targetBucket: this.targetBucket,
        targetRegion: this.targetRegion,
        targetKeyTemplate: this.targetKeyTemplate,
        setHeaders: this.setHeaders,
        setAcls: this.setAcls,
        setTags: this.setTags,
        deleteSourceKey: this.deleteSourceKey,
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

module.exports = CosCopyFileTask;
