const crypto = require('crypto');
const { Transform } = require('stream');

class HashTransformStream extends Transform {
  constructor(
    { algorithm = 'md5', digestEncoding = 'hex', ...args } = {},
    ...resArgs
  ) {
    super(args, ...resArgs);
    this.hash = crypto.createHash(algorithm);
    this.digestEncoding = digestEncoding;
  }
  _transform(chunk, encoding, callback) {
    this.hash.update(chunk);
    callback(null, chunk);
  }
  _flush(callback) {
    this.emit('hash', this.hash.digest(this.digestEncoding).toLowerCase());
    callback();
  }
}

module.exports = HashTransformStream;
