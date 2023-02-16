/* eslint-disable arrow-body-style */
/* eslint-disable no-unused-vars */
/* eslint-disable no-param-reassign */
const ScfInvokeTask = require('./ScfInvokeTask');
const CosAnalyzeInventoryProcessTask = require('./CosAnalyzeInventoryProcessTask');
const {
  validateAnalyzeConfig,
  fixAnalyzeConfig,
} = require('./Filter/utils/analyzeUtils');

class CosAnalyzeInventoryTask {
  constructor({
    cosSdkInstance,
    scfSdkInstance,
    cosUpload,
    parentRequestId,
    context,
    functionName,
    sourceList,
    bucket,
    region,
    key,
    prefix,
    preAnalyzeConfig,
    analyzeConfig,
  }) {
    Object.assign(this, {
      cosSdkInstance,
      scfSdkInstance,
      cosUpload,
      parentRequestId,
      context,
      functionName,
      sourceList,
      bucket,
      region,
      key: key || `${prefix}${functionName}/${context.request_id}/result.csv`,
      prefix,
      preAnalyzeConfig: preAnalyzeConfig
        ? fixAnalyzeConfig(preAnalyzeConfig)
        : preAnalyzeConfig,
      analyzeConfig: fixAnalyzeConfig(analyzeConfig),
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      let { sourceList } = this;
      if (
        !this.parentRequestId
        && this.preAnalyzeConfig
        && this.preAnalyzeConfig.columns
        && this.preAnalyzeConfig.columns.length
      ) {
        const partNumber = 20;
        const scfInvokeTask = new ScfInvokeTask({
          scfSdkInstance: this.scfSdkInstance,
          parallel: partNumber,
          paramsList: this.getSplitList({
            sourceList,
            partNumber,
          }).map((items, index) => ({
            Region: this.context.tencentcloud_region,
            FunctionName: this.context.function_name,
            Namespace: this.context.namespace,
            InvocationType: 'Event',
            Qualifier: '$DEFAULT',
            ClientContext: JSON.stringify({
              bucket: this.bucket,
              region: this.region,
              key: `${this.prefix}${this.functionName}/${this.context.request_id}/tmp/${index}`,
              analyzeConfig: {
                ...this.preAnalyzeConfig,
                targetSetHeader: false,
              },
              sourceList: items,
              parentRequestId: this.context.request_id,
            }),
          })),
        });
        const scfInvokeTaskResults = await scfInvokeTask.runTask();
        sourceList = scfInvokeTaskResults.map(({ params }) => {
          const { ClientContext } = params;
          const { bucket, region, key } = JSON.parse(ClientContext);
          return {
            bucket,
            region,
            key,
            url: this.cosSdkInstance.getObjectUrl({
              Bucket: bucket,
              Region: region,
              Key: key,
              Sign: false,
            }),
            fileFormat: 'CSV',
            fileSchema: this.analyzeConfig.columns
              .map(item => item.key)
              .join(', '),
          };
        });
      }
      const cosAnalyzeInventoryProcessTask = new CosAnalyzeInventoryProcessTask({
        cosSdkInstance: this.cosSdkInstance,
        cosUpload: this.cosUpload,
        bucket: this.bucket,
        region: this.region,
        key: this.key,
        analyzeConfig: this.analyzeConfig,
        sourceList,
      });
      result = await cosAnalyzeInventoryProcessTask.runTask();
    } catch (err) {
      error = err;
    }
    return {
      params: {
        parentRequestId: this.parentRequestId,
        context: this.context,
        functionName: this.functionName,
        sourceListLength: this.sourceList.length,
        bucket: this.bucket,
        region: this.region,
        key: this.key,
        prefix: this.prefix,
        preAnalyzeConfig: this.preAnalyzeConfig,
        analyzeConfig: this.analyzeConfig,
      },
      result,
      error,
    };
  }
  getSplitList({ sourceList, partNumber = 10 }) {
    if (sourceList.length <= partNumber) {
      return sourceList.map(item => [item]);
    }
    const list = [...sourceList];
    const results = Array(partNumber)
      .fill()
      .map(() => []);
    for (let i = 0, len = list.length; i < len; i++) {
      const item = list[i];
      results[i % partNumber].push(item);
    }
    return results;
  }
}

module.exports = CosAnalyzeInventoryTask;
