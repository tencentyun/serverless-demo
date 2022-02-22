const { Writable } = require('stream');

class TrashWriteStream extends Writable {
  _write(chunk, encoding, callback) {
    callback();
  }
  _final(callback) {
    callback();
  }
}

module.exports = TrashWriteStream;
