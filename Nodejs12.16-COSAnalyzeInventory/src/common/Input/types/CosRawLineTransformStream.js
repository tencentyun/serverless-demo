/* eslint-disable no-param-reassign */
const LineConsumerTransformStream = require('../LineConsumerTransformStream');

class CosRawLineTransformStream extends LineConsumerTransformStream {
  constructor(
    {
      recordDelimiter = ['\r\n', '\n'],
      expressionType = 'NONE',
      expression = 'NONE',
      ...args
    },
    ...resArgs
  ) {
    super(
      {
        lineDelimiterList: recordDelimiter,
        ...args,
      },
      ...resArgs,
    );
    Object.assign(this, {
      expressionType,
      expression,
      regexp: null,
    });
  }
  _getLineParams(content) {
    return content;
  }
  _filterLineParams(content) {
    const { expressionType, expression } = this;
    if (expressionType.toLowerCase() === 'includes') {
      return content.includes(expression);
    }
    if (expressionType.toLowerCase() === 'regexp') {
      if (!this.regexp) {
        this.regexp = new RegExp(expression);
      }
      return this.regexp.test(content);
    }
    return Boolean(content);
  }
}

module.exports = CosRawLineTransformStream;
