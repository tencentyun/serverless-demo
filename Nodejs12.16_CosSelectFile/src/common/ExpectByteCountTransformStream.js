const { Transform } = require('stream');

class ExpectByteCountTransformStream extends Transform {
  constructor({ validateFunc, ...args }, ...resArgs) {
    super(args, ...resArgs);
    this.validateFunc = validateFunc;
    this.currentByteCount = 0;
  }
  _transform(chunk, encoding, callback) {
    this.currentByteCount += chunk.length;
    if (this.validateFunc(this.currentByteCount)) {
      callback(null, chunk);
    } else {
      callback(new Error(`ExpectByteCountTransformStream error, loaded stream size ${this.currentByteCount}`));
    }
  }
  _flush(callback) {
    callback();
  }
}

module.exports = ExpectByteCountTransformStream;
