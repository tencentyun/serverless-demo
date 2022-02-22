/* eslint-disable no-underscore-dangle */
const { Transform } = require('stream');

class ListConsumerTransformStream extends Transform {
  constructor({ getListContent, getFinalContent, ...args }, ...resArgs) {
    super(
      {
        readableObjectMode: true,
        writableObjectMode: true,
        ...args,
      },
      ...resArgs,
    );
    if (typeof getListContent === 'function') {
      this._getListContent = getListContent;
    }
    if (typeof getFinalContent === 'function') {
      this._getFinalContent = getFinalContent;
    }
  }
  _getListContent(list) {
    return list;
  }
  _getFinalContent() {
    return null;
  }
  _transform(chunk, encoding, callback) {
    try {
      callback(null, this._getListContent(chunk));
    } catch (err) {
      callback(err);
    }
  }
  _flush(callback) {
    try {
      callback(null, this._getFinalContent());
    } catch (err) {
      callback(err);
    }
  }
}

module.exports = ListConsumerTransformStream;
