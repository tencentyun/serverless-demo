const JsonataTransformStream = require('./types/JsonataTransformStream');
const CustomTransformStream = require('./types/CustomTransformStream');
const { getCamelCaseData } = require('../utils');

const { PassThrough } = require('stream');

class Filter {
  constructor({ filter = 'JSONata', params = {} }) {
    Object.assign(this, {
      filter,
      params,
      camelCaseParams: getCamelCaseData(params),
    });
  }
  getTransformStream() {
    const { filter } = this;
    if (filter === 'JSONata') {
      return new JsonataTransformStream(this.camelCaseParams);
    }
    if (filter === 'PassThrough') {
      return new PassThrough({
        readableObjectMode: true,
        writableObjectMode: true,
      });
    }
    if (filter === 'Custom') {
      return new CustomTransformStream(this.params);
    }
    throw new Error(`unknown filter: ${filter}`);
  }
}

module.exports = Filter;
