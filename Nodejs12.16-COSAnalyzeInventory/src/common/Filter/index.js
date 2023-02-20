const InventoryAnalyzeTransformStream = require('./types/InventoryAnalyzeTransformStream');
const CustomTransformStream = require('./types/CustomTransformStream');
const { getCamelCaseData } = require('../utils');

const { PassThrough } = require('stream');

class Filter {
  constructor({ filter = 'PassThrough', params = {} }) {
    Object.assign(this, {
      filter,
      params,
      camelCaseParams: getCamelCaseData(params),
    });
  }
  getTransformStream() {
    const { filter } = this;
    if (filter === 'PassThrough') {
      return new PassThrough({
        readableObjectMode: true,
        writableObjectMode: true,
      });
    }
    if (filter === 'Custom') {
      return new CustomTransformStream(this.params);
    }
    if (filter === 'InventoryAnalyzeTransformStream') {
      return new InventoryAnalyzeTransformStream(this.params);
    }
    throw new Error(`unknown filter: ${filter}`);
  }
}

module.exports = Filter;
