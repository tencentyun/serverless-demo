/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const ScfInvokeTask = require('./ScfInvokeTask');
const CosTbaseBackupProcessTask = require('./CosTbaseBackupProcessTask');
const moment = require('moment');
const { logger } = require('./utils');

class CosTbaseBackupTask {
  constructor({
    cosSdkInstance,
    scfSdkInstance,
    tbaseSdkInstance,
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
      tbaseSdkInstance,
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
              targetKeyTemplate: this.targetKeyTemplate,
              instanceList: [item],
              parentRequestId: this.context.request_id,
            }),
          })),
        });
        result = await scfInvokeTask.runTask();
      } else {
        const cosTbaseBackupProcessTask = new CosTbaseBackupProcessTask({
          cosSdkInstance: this.cosSdkInstance,
          tbaseSdkInstance: this.tbaseSdkInstance,
          cosUpload: this.cosUpload,
          targetBucket: this.targetBucket,
          targetRegion: this.targetRegion,
          targetKeyTemplate: this.targetKeyTemplate,
          instanceList: this.instanceList,
        });
        result = await cosTbaseBackupProcessTask.runTask();
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
        StartTime: startTime,
        EndTime: endTime,
        OrderBy: 'start_time',
        OrderByType: 'DESC',
      };
      const PageSize = 100;
      let PageNumber = 1;
      while (true) {
        const { BaseBackups = [], TotalCount } =          await this.tbaseSdkInstance.requestRetry({
          action: 'DescribeBaseBackups',
          params: {
            ...params,
            PageNumber,
            PageSize,
          },
        });
        results.push(...BaseBackups);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (BaseBackups.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          PageNumber += 1;
        }
      }
      return results
        .filter(({ StartTime, EndTime }) => {
          return (
            EndTime
            && EndTime.length > 0
            && moment(startTime).unix() <= moment(StartTime).unix()
            && moment(StartTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            InstanceId,
            BackupId: item.BackupId,
            FileDir: item.FileDir,
            PublicNetworkDownloadEnable: true,
            IsWALBackup: false,
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosTbaseBackupTask.getBaseBackupList',
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
        StartTime: startTime,
        EndTime: endTime,
        OrderBy: 'start_time',
        OrderByType: 'DESC',
      };
      const PageSize = 100;
      let PageNumber = 1;
      while (true) {
        const { WALBackups = [], TotalCount } =          await this.tbaseSdkInstance.requestRetry({
          action: 'DescribeWALBackups',
          params: {
            ...params,
            PageNumber,
            PageSize,
          },
        });
        results.push(...WALBackups);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (WALBackups.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          PageNumber += 1;
        }
      }
      return results
        .filter(({ StartTime, EndTime }) => {
          return (
            EndTime
            && EndTime.length > 0
            && moment(startTime).unix() <= moment(StartTime).unix()
            && moment(StartTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            InstanceId,
            BackupId: 0,
            FileName: item.FileName,
            PublicNetworkDownloadEnable: true,
            IsWALBackup: true,
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosTbaseBackupTask.getLogBackupList',
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
    const list = [];
    const results = [];
    for (const instance of this.instanceList) {
      try {
        if (
          this.backupTypeList.includes('physical')
          || this.backupTypeList.includes('logical')
          || this.backupTypeList.includes('baseBackup')
        ) {
          const baseBackupList = await this.getBaseBackupList(instance);
          baseBackupList.forEach((item) => {
            if (
              this.backupTypeList.includes(item.BackupType)
              || this.backupTypeList.includes('baseBackup')
            ) {
              list.push(item);
            }
          });
        }
        if (this.backupTypeList.includes('wal')) {
          const logBackupList = await this.getLogBackupList(instance);
          logBackupList.forEach(item => list.push(item));
        }
      } catch (error) {
        let code = '';
        if (error && error.error && error.error.code) {
          code = error.error.code;
        } else if (error && error.code) {
          code = error.code;
        }
        if (code && code.includes && code.includes('InvalidInstanceId')) {
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
    for (const instance of list) {
      const {
        Region,
        InstanceId,
        BackupId,
        FileDir,
        FileName,
        PublicNetworkDownloadEnable,
        IsWALBackup,
      } = instance;
      const { Items = [] } = await this.tbaseSdkInstance.requestRetry({
        action: 'DescribeBackupDownloadLink',
        params: {
          Region,
          InstanceId,
          BackupId,
          FileName: FileDir || FileName,
          PublicNetworkDownloadEnable,
          IsWALBackup,
        },
      });
      results.push(...Items.map(item => ({ ...instance, ...item })));
    }
    // 进行一次 checkNeedRunTask 检测，判断哪些子任务是没必要发起的
    const cosTbaseBackupProcessTask = new CosTbaseBackupProcessTask({
      cosSdkInstance: this.cosSdkInstance,
      tbaseSdkInstance: this.tbaseSdkInstance,
      cosUpload: this.cosUpload,
      targetBucket: this.targetBucket,
      targetRegion: this.targetRegion,
      targetKeyTemplate: this.targetKeyTemplate,
      instanceList: results,
      mode: 'checkNeedRunTask',
      parallel: 5,
    });
    const taskResults = await cosTbaseBackupProcessTask.runTask();
    return taskResults
      .filter(item => item.result !== 'DoNotNeedRunTask')
      .map(item => item.params);
  }
}

module.exports = CosTbaseBackupTask;
