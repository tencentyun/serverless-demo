/* eslint-disable no-underscore-dangle */
const TaskQueue = require('./TaskQueue');

class FileDirTaskQueue extends TaskQueue {
  constructor(
    {
      cosSdkInstance,
      filterFileTask,
      processFileTask,
      processFileResult,
      ...args
    },
    ...resArgs
  ) {
    super(args, ...resArgs);
    if (typeof filterFileTask === 'function') {
      this._filterFileTask = filterFileTask;
    }
    if (typeof processFileTask === 'function') {
      this._processFileTask = processFileTask;
    }
    if (typeof processFileResult === 'function') {
      this._processFileResult = processFileResult;
    }
    Object.assign(this, {
      cosSdkInstance,
    });
  }
  async _processDirTask({ uuid, params }) {
    const { bucket, region, key, marker, keyMarker } = params;
    const {
      Contents = [],
      NextMarker,
      NextKeyMarker,
      IsTruncated,
    } = await this.cosSdkInstance.getBucket({
      Bucket: bucket,
      Region: region,
      Prefix: key === '/' ? '' : key,
      Marker: marker,
      KeyMarker: keyMarker,
      MaxKeys: 1000,
    });
    const fileTasks = Contents.map(({ Key }) => ({
      ...params,
      key: Key,
      isFile: true,
    })).filter(this._filterFileTask);
    const dirTasks = {
      ...params,
      marker: NextMarker,
      keyMarker: NextKeyMarker,
    };
    const tasks = IsTruncated === 'true' ? [...fileTasks, dirTasks] : fileTasks;
    this.addTasks({
      uuid,
      tasks,
    });
    return {
      type: '_processDirTask',
    };
  }
  _filterFileTask() {
    return true;
  }
  async _processFileTask() {
    throw new Error('_processFileTask is not implemented');
  }
  async _processFileResult() {
    return null;
  }
  _processTask({ params, ...args }) {
    const { key, isFile } = params;
    if (/\/$/.test(key) && !isFile) {
      return this._processDirTask({ params, ...args });
    }
    return this._processFileTask({ params, ...args });
  }
  async _processResult({ lastResult, currentTask }) {
    const { result = {} } = currentTask || {};
    if (result && result.type === '_processDirTask') {
      return lastResult;
    }
    const fileResult = await this._processFileResult({
      lastResult,
      currentTask,
    });
    return fileResult;
  }
}

module.exports = FileDirTaskQueue;
