/* eslint-disable no-param-reassign */
const { streamPipelinePromise } = require('./utils');

const Input = require('./Input/index');
const Filter = require('./Filter/index');
const Output = require('./Output/index');

class CosExporterTask {
  constructor({
    cosSdkInstance,
    cosUpload,
    sourceList,
    functionName,
    inputConfig = {},
    filterConfig = {},
    outputConfig = {},
  }) {
    sourceList = sourceList.map(item => ({
      inputConfig,
      ...item,
    }));

    let extractor = 'CosRawLine';
    try {
      extractor = sourceList[0].inputConfig.extractor || 'CosRawLine';
    } catch (err) {}

    if (extractor === 'CosRawLine') {
      filterConfig = {
        filter: 'PassThrough',
        ...filterConfig,
      };
    }

    Object.assign(this, {
      cosSdkInstance,
      cosUpload,
      sourceList,
      functionName,
      inputConfig,
      filterConfig,
      outputConfig,
    });
  }
  async runTask() {
    let result;
    let error;
    try {
      const input = new Input({
        cosSdkInstance: this.cosSdkInstance,
        sourceList: this.sourceList,
      });
      const filter = new Filter({
        ...this.filterConfig,
      });
      const output = new Output({
        cosUpload: this.cosUpload,
        functionName: this.functionName,
        sourceList: this.sourceList,
        ...this.outputConfig,
      });
      const { streamList, promiseList } =        output.getWriteStreamListAndPromiseList();
      result = await Promise.all([
        streamPipelinePromise([
          input.getReadStream(),
          filter.getTransformStream(),
          ...streamList,
        ]),
        ...promiseList,
      ]);
    } catch (err) {
      error = err;
    }
    return {
      params: {
        sourceListLength: this.sourceList.length,
        inputConfig: this.inputConfig,
        filterConfig: this.filterConfig,
        outputConfig: this.outputConfig,
        functionName: this.functionName,
      },
      result,
      error,
    };
  }
}

module.exports = CosExporterTask;
