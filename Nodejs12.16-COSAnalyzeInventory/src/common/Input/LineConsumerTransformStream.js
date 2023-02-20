/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

class LineConsumerTransformStream extends Transform {
  constructor(
    {
      getLineParams,
      filterLineParams,
      getLineParamsList,
      lineDelimiterList = ['\r\n', '\n'],
      ...args
    },
    ...resArgs
  ) {
    super(
      {
        readableObjectMode: true,
        writableObjectMode: true,
        ...args,
      },
      ...resArgs,
    );
    if (typeof getLineParams === 'function') {
      this._getLineParams = getLineParams;
    }
    if (typeof filterLineParams === 'function') {
      this._filterLineParams = filterLineParams;
    }
    if (typeof getLineParamsList === 'function') {
      this._getLineParamsList = getLineParamsList;
    }
    if (lineDelimiterList && !(lineDelimiterList instanceof Array)) {
      lineDelimiterList = [lineDelimiterList];
    }
    Object.assign(this, {
      restContent: '',
      lineDelimiterList,
    });
  }
  _getLineParams(item) {
    return item;
  }
  _filterLineParams() {
    return true;
  }
  _getLineParamsList(lines) {
    return lines
      .map(item => this._getLineParams(item))
      .filter(item => this._filterLineParams(item));
  }
  _transform(chunk, encoding, callback) {
    try {
      const content = this.restContent + chunk.toString(encoding || 'utf8');
      const newLine = this.lineDelimiterList.find(item => content.includes(item));
      if (newLine) {
        const lines = content.split(newLine);
        const lastPart = lines.pop();
        this.restContent = lastPart;
        const paramsList = this._getLineParamsList(lines);
        if (paramsList.length) {
          callback(null, paramsList);
        } else {
          callback();
        }
      } else {
        this.restContent = content;
        callback();
      }
    } catch (err) {
      callback(err);
    }
  }
  _flush(callback) {
    try {
      if (this.restContent) {
        const content = this.restContent;
        this.restContent = '';
        const paramsList = this._getLineParamsList([content]);
        if (paramsList.length) {
          callback(null, paramsList);
        } else {
          callback();
        }
      } else {
        callback();
      }
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = LineConsumerTransformStream;
