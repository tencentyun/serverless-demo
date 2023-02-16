/* eslint-disable no-param-reassign */
const LineConsumerTransformStream = require('../LineConsumerTransformStream');

class CosNormalCsvTransformStream extends LineConsumerTransformStream {
  constructor(
    {
      recordDelimiter = ['\r\n', '\n'],
      columns = [],
      colDelimiter = ',',
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
      columns,
      colDelimiter,
      uuidPrefix: `cos_${Date.now() % 1000}_`,
    });
  }
  _getLineParams(content) {
    const { columns, colDelimiter, uuidPrefix } = this;
    const placeholderMap = {};
    let index = 0;
    /**
     * try to replace "value" with an unique placeholder in content
     * because "value" may includes colDelimiter, it maybe affected by split method
     */
    content = content.replace(/"([\s\S])*?"/g, (value) => {
      index += 1;
      const uuid = `${uuidPrefix}${index}`;
      placeholderMap[uuid] = value;
      return uuid;
    });
    const values = content.split(colDelimiter);
    return columns.reduce((res, { key }, index) => {
      const value = values[index] || '';
      // try to replace the placeholder with true "value"
      res[key] = placeholderMap[value] || value;
      return res;
    }, {});
  }
  _filterLineParams(content) {
    return Boolean(content);
  }
}

module.exports = CosNormalCsvTransformStream;
