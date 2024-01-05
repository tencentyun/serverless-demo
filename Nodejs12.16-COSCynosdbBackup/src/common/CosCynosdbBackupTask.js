/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const ScfInvokeTask = require('./ScfInvokeTask');
const CosCynosdbBackupProcessTask = require('./CosCynosdbBackupProcessTask');
const moment = require('moment');

class CosCynosdbBackupTask {
  constructor({
    cosSdkInstance,
    scfSdkInstance,
    cynosdbSdkInstance,
    cosUpload,
    parentRequestId,
    context,
    functionName,
    triggerTime,
    targetBucket,
    targetRegion,
    targetPrefix,
    backTrackDays,
    instanceList,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      scfSdkInstance,
      cynosdbSdkInstance,
      cosUpload,
      parentRequestId,
      context,
      functionName,
      triggerTime,
      targetBucket,
      targetRegion,
      targetPrefix,
      backTrackDays,
      instanceList,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      if (!this.parentRequestId) {
        const splitList = await this.getSplitList();
        const partNumber = Math.min(splitList.length, 20);
        const scfInvokeTask = new ScfInvokeTask({
          scfSdkInstance: this.scfSdkInstance,
          parallel: partNumber,
          paramsList: splitList.map(item => ({
            Region: this.context.tencentcloud_region,
            FunctionName: this.context.function_name,
            Namespace: this.context.namespace,
            InvocationType: 'Event',
            Qualifier: '$DEFAULT',
            ClientContext: JSON.stringify({
              targetBucket: this.targetBucket,
              targetRegion: this.targetRegion,
              targetPrefix: this.targetPrefix,
              instanceList: [item],
              parentRequestId: this.context.request_id,
            }),
          })),
        });
        result = await scfInvokeTask.runTask();
      } else {
        const cosCynosdbBackupProcessTask = new CosCynosdbBackupProcessTask({
          cosSdkInstance: this.cosSdkInstance,
          cynosdbSdkInstance: this.cynosdbSdkInstance,
          cosUpload: this.cosUpload,
          targetBucket: this.targetBucket,
          targetRegion: this.targetRegion,
          targetPrefix: this.targetPrefix,
          instanceList: this.instanceList,
        });
        result = await cosCynosdbBackupProcessTask.runTask();
      }
    } catch (err) {
      error = err;
    }
    return {
      params: {
        parentRequestId: this.parentRequestId,
        context: this.context,
        functionName: this.functionName,
        targetBucket: this.targetBucket,
        targetRegion: this.targetRegion,
        targetPrefix: this.targetPrefix,
        backTrackDays: this.backTrackDays,
        instanceList: this.instanceList,
      },
      result,
      error,
    };
  }
  async getLogicBackupList({ Region, ClusterId }) {
    try {
      const { startTime, endTime } = this.getTimeRange();
      const results = [];
      const params = {
        Region,
        ClusterId,
        StartTime: startTime,
        EndTime: endTime,
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { BackupList = [], TotalCount } =          await this.cynosdbSdkInstance.requestRetry({
          action: 'DescribeBackupList',
          params: {
            ...params,
            BackupType: 'logic',
            Offset,
            Limit,
          },
        });
        results.push(...BackupList);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else {
          Offset += Limit;
        }
      }
      return results
        .filter(({ BackupStatus, StartTime }) => {
          return (
            BackupStatus === 'success'
            && moment(startTime).unix() <= moment(StartTime).unix()
            && moment(StartTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            ClusterId,
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosCynosdbBackupTask.getLogicBackupList',
        params: {
          Region,
          ClusterId,
        },
        error,
      };
    }
  }
  async getBinlogBackupList({ Region, ClusterId }) {
    try {
      const { startTime, endTime } = this.getTimeRange();
      const results = [];
      const params = {
        Region,
        ClusterId,
        StartTime: startTime,
        EndTime: endTime,
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { Binlogs = [], TotalCount } =          await this.cynosdbSdkInstance.requestRetry({
          action: 'DescribeBinlogs',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        results.push(...Binlogs);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else {
          Offset += Limit;
        }
      }
      return results
        .filter(({ StartTime }) => {
          return (
            moment(startTime).unix() <= moment(StartTime).unix()
            && moment(StartTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            ClusterId,
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosCynosdbBackupTask.getBinlogBackupList',
        params: {
          Region,
          ClusterId,
        },
        error,
      };
    }
  }
  getTimeRange() {
    const startTime = moment(this.triggerTime)
      .utcOffset('+08:00')
      .subtract(this.backTrackDays, 'days')
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    const endTime = moment(this.triggerTime)
      .utcOffset('+08:00')
      .endOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    return {
      startTime,
      endTime,
    };
  }
  async getSplitList() {
    const results = [];
    for (const instance of this.instanceList) {
      const logicBackupList = await this.getLogicBackupList(instance);
      const binlogBackupList = await this.getBinlogBackupList(instance);
      results.push(...logicBackupList, ...binlogBackupList);
    }
    return results;
  }
}

module.exports = CosCynosdbBackupTask;
