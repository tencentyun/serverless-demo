/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const ScfInvokeTask = require('./ScfInvokeTask');
const CosPostgresBackupProcessTask = require('./CosPostgresBackupProcessTask');
const moment = require('moment');

class CosPostgresBackupTask {
  constructor({
    cosSdkInstance,
    scfSdkInstance,
    postgresSdkInstance,
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
    timeRange,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      scfSdkInstance,
      postgresSdkInstance,
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
        const cosPostgresBackupProcessTask = new CosPostgresBackupProcessTask({
          cosSdkInstance: this.cosSdkInstance,
          postgresSdkInstance: this.postgresSdkInstance,
          cosUpload: this.cosUpload,
          targetBucket: this.targetBucket,
          targetRegion: this.targetRegion,
          targetKeyTemplate: this.targetKeyTemplate,
          instanceList: this.instanceList,
        });
        result = await cosPostgresBackupProcessTask.runTask();
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
        targetKeyTemplate: this.targetKeyTemplate,
        backTrackDays: this.backTrackDays,
        instanceList: this.instanceList,
        timeRange: this.timeRange,
      },
      result,
      error,
    };
  }
  async getBaseBackupList({ Region, DBInstanceId }) {
    try {
      const { startTime, endTime } = this.getTimeRange();
      const results = [];
      const params = {
        Region,
        MinFinishTime: startTime,
        MaxFinishTime: endTime,
        Filters: [
          {
            Name: 'db-instance-id',
            Values: [DBInstanceId],
          },
        ],
        OrderBy: 'FinishTime',
        OrderByType: 'desc',
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { BaseBackupSet = [], TotalCount } =          await this.postgresSdkInstance.requestRetry({
          action: 'DescribeBaseBackups',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        results.push(...BaseBackupSet);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (BaseBackupSet.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          Offset += Limit;
        }
      }
      return results
        .filter(({ State, FinishTime }) => {
          return (
            State === 'finished'
            && moment(startTime).unix() <= moment(FinishTime).unix()
            && moment(FinishTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            DBInstanceId,
            BackupId: item.Id,
            BackupType: 'BaseBackup',
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosPostgresBackupTask.getBaseBackupList',
        params: {
          Region,
          DBInstanceId,
        },
        error,
      };
    }
  }
  async getLogBackupList({ Region, DBInstanceId }) {
    try {
      const { startTime, endTime } = this.getTimeRange();
      const results = [];
      const params = {
        Region,
        MinFinishTime: startTime,
        MaxFinishTime: endTime,
        Filters: [
          {
            Name: 'db-instance-id',
            Values: [DBInstanceId],
          },
        ],
        OrderBy: 'FinishTime',
        OrderByType: 'desc',
      };
      const Limit = 100;
      let Offset = 0;
      while (true) {
        const { LogBackupSet = [], TotalCount } =          await this.postgresSdkInstance.requestRetry({
          action: 'DescribeLogBackups',
          params: {
            ...params,
            Offset,
            Limit,
          },
        });
        results.push(...LogBackupSet);
        if (parseInt(TotalCount, 10) === results.length) {
          break;
        } else if (LogBackupSet.length === 0) {
          // 兜底措施，如果最近拉取到的页资源数为空，则不再进一步拉取，防止无限拉取
          break;
        } else {
          Offset += Limit;
        }
      }
      return results
        .filter(({ State, FinishTime }) => {
          return (
            State === 'finished'
            && moment(startTime).unix() <= moment(FinishTime).unix()
            && moment(FinishTime).unix() <= moment(endTime).unix()
          );
        })
        .map((item) => {
          return {
            Region,
            DBInstanceId,
            BackupId: item.Id,
            BackupType: 'LogBackup',
            ...item,
          };
        });
    } catch (error) {
      throw {
        action: 'CosPostgresBackupTask.getLogBackupList',
        params: {
          Region,
          DBInstanceId,
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
      const baseBackupList = await this.getBaseBackupList(instance);
      const logBackupList = await this.getLogBackupList(instance);
      baseBackupList.forEach(item => results.push(item));
      logBackupList.forEach(item => results.push(item));
    }
    return results;
  }
}

module.exports = CosPostgresBackupTask;
