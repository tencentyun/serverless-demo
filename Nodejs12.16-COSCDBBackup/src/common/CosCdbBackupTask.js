/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const ScfInvokeTask = require('./ScfInvokeTask');
const CosCdbBackupProcessTask = require('./CosCdbBackupProcessTask');
const moment = require('moment');
const { logger } = require('./utils');

class CosCdbBackupTask {
  constructor({
    cosSdkInstance,
    scfSdkInstance,
    cdbSdkInstance,
    cosUpload,
    parentRequestId,
    context,
    functionName,
    triggerTime,
    targetBucket,
    targetRegion,
    targetKeyTemplate,
    backTrackDays,
    instanceList,
    backupTypeList,
    timeRange,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      scfSdkInstance,
      cdbSdkInstance,
      cosUpload,
      parentRequestId,
      context,
      functionName,
      triggerTime,
      targetBucket,
      targetRegion,
      targetKeyTemplate,
      backTrackDays,
      instanceList,
      backupTypeList,
      timeRange,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      if (!this.parentRequestId) {
        const splitList = await this.getSplitList();
        const partNumber = Math.min(splitList.length, 10);
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
              targetKeyTemplate: this.targetKeyTemplate,
              instanceList: [item],
              parentRequestId: this.context.request_id,
            }),
          })),
        });
        result = await scfInvokeTask.runTask();
      } else {
        const cosCdbBackupProcessTask = new CosCdbBackupProcessTask({
          cosSdkInstance: this.cosSdkInstance,
          cdbSdkInstance: this.cdbSdkInstance,
          cosUpload: this.cosUpload,
          targetBucket: this.targetBucket,
          targetRegion: this.targetRegion,
          targetKeyTemplate: this.targetKeyTemplate,
          instanceList: this.instanceList,
        });
        result = await cosCdbBackupProcessTask.runTask();
      }
    } catch (err) {
      error = err;
    }
    if (result && Array.isArray(result)) {
      result = {
        resultLength: result.length,
        resultParts: result.slice(0, 5),
      };
    }
    return {
      params: {
        parentRequestId: this.parentRequestId,
        context: this.context,
        functionName: this.functionName,
        targetBucket: this.targetBucket,
        targetRegion: this.targetRegion,
        targetKeyTemplate: this.targetKeyTemplate,
        backTrackDays: this.backTrackDays,
        instanceList: this.instanceList,
        backupTypeList: this.backupTypeList,
        timeRange: this.timeRange,
      },
      result,
      error,
    };
  }
  async getBaseBackupList({ Region, InstanceId }) {
    try {
      const { startTime, endTime } = this.getTimeRange();
      const results = [];
      const params = {
        Region,
        InstanceId,
        MinStartTime: startTime,
        MaxStartTime: endTime,
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { Items = [], TotalCount } =          await this.cdbSdkInstance.requestRetry({
          action: 'DescribeBackups',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        results.push(...Items);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (Items.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          Offset += Limit;
        }
      }
      return results
        .filter(({ StartTime, Status }) => {
          return (
            Status === 'SUCCESS'
            && moment(startTime).unix() <= moment(StartTime).unix()
            && moment(StartTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            InstanceId,
            RequestAction: 'DescribeBackups',
            BackupType: item.Type,
            BackupId: item.BackupId || item.Name,
            StartTime: item.StartTime,
            FinishTime: item.FinishTime,
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosCdbBackupTask.getBaseBackupList',
        params: {
          Region,
          InstanceId,
        },
        error,
      };
    }
  }
  async getLogBackupList({ Region, InstanceId }) {
    try {
      const { startTime, endTime } = this.getTimeRange();
      const results = [];
      const params = {
        Region,
        InstanceId,
        MinStartTime: startTime,
        MaxStartTime: endTime,
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { Items = [], TotalCount } =          await this.cdbSdkInstance.requestRetry({
          action: 'DescribeBinlogs',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        results.push(...Items);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (Items.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          Offset += Limit;
        }
      }
      return results
        .filter(({ BinlogStartTime, Status }) => {
          return (
            Status === 'SUCCESS'
            && moment(startTime).unix() <= moment(BinlogStartTime).unix()
            && moment(BinlogStartTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            InstanceId,
            RequestAction: 'DescribeBinlogs',
            BackupType: item.Type,
            BackupId: item.BackupId || item.Name,
            StartTime: item.BinlogStartTime,
            FinishTime: item.BinlogFinishTime,
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosCdbBackupTask.getLogBackupList',
        params: {
          Region,
          InstanceId,
        },
        error,
      };
    }
  }
  getTimeRange() {
    if (this.timeRange) {
      return this.timeRange;
    }
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
      try {
        if (
          this.backupTypeList.includes('baseBackup')
          || this.backupTypeList.includes('all')
          || this.backupTypeList.includes('allBaseBackup')
        ) {
          const baseBackupList = await this.getBaseBackupList(instance);
          baseBackupList.forEach((item) => {
            if (
              this.backupTypeList.includes(item.BackupType)
              || this.backupTypeList.includes('all')
              || this.backupTypeList.includes('allBaseBackup')
            ) {
              results.push(item);
            }
          });
        }
        if (
          this.backupTypeList.includes('logBackup')
          || this.backupTypeList.includes('all')
          || this.backupTypeList.includes('allLogBackup')
        ) {
          const logBackupList = await this.getLogBackupList(instance);
          logBackupList.forEach((item) => {
            if (
              this.backupTypeList.includes(item.BackupType)
              || this.backupTypeList.includes('all')
              || this.backupTypeList.includes('allLogBackup')
            ) {
              results.push(item);
            }
          });
        }
      } catch (error) {
        let code = '';
        if (error && error.error && error.error.code) {
          code = error.error.code;
        } else if (error && error.code) {
          code = error.code;
        }
        if (code && code.includes && code.includes('InvalidParameter')) {
          // 如果异常为实例不存在，可能是用户已删除了实例，忽略该异常
          logger({
            title: 'Harmless error',
            data: error,
          });
        } else {
          throw error;
        }
      }
    }
    // 进行一次 checkNeedRunTask 检测，判断哪些子任务是没必要发起的
    const cosCdbBackupProcessTask = new CosCdbBackupProcessTask({
      cosSdkInstance: this.cosSdkInstance,
      cdbSdkInstance: this.cdbSdkInstance,
      cosUpload: this.cosUpload,
      targetBucket: this.targetBucket,
      targetRegion: this.targetRegion,
      targetKeyTemplate: this.targetKeyTemplate,
      instanceList: results,
      mode: 'checkNeedRunTask',
      parallel: 5,
    });
    const taskResults = await cosCdbBackupProcessTask.runTask();
    return taskResults
      .filter(item => item.result !== 'DoNotNeedRunTask')
      .map(item => item.params);
  }
}

module.exports = CosCdbBackupTask;
