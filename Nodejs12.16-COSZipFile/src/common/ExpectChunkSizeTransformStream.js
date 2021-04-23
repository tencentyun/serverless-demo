/* eslint-disable no-underscore-dangle */
const { Duplex } = require('stream');
const SimpleBuffer = require('./SimpleBuffer');

class ExpectChunkSizeTransformStream extends Duplex {
  constructor({ chunkSize, ...args }, ...resArgs) {
    super(args, ...resArgs);
    this._readableState.sync = false;
    Object.assign(this, {
      chunk: new SimpleBuffer(),
      encoding: null,
      writeCallback: null,
      finalCallback: null,
      chunkSize,
    });
    // this.on('prefinish', () => this._final());
  }
  _read() {
    if (this.writeCallback || this.finalCallback) {
      this.consume();
    }
  }
  _write(chunk, encoding, callback) {
    this.chunk.concat(chunk);
    this.encoding = encoding;
    if (this.chunk.length() < this.chunkSize && !this.finalCallback) {
      callback();
    } else {
      this.writeCallback = callback;
      this.consume();
    }
  }
  _final(callback) {
    this.finalCallback = callback;
    this.consume();
  }
  consume() {
    if (this.chunk.length() === 0) {
      this.consumeCallback();
      return;
    }

    const cacheSize = this.chunk.length();
    /**
     * try to push data with exact chunkSize to downstream
     * if the rest chunk is less than chunkSize, push it to downstream too
     */
    if (cacheSize >= this.chunkSize || this.finalCallback) {
      const consume = this.chunk.slice(0, Math.min(cacheSize, this.chunkSize));
      this.push(consume, this.encoding);
    } else {
      this.consumeCallback();
    }
  }
  consumeCallback() {
    if (this.writeCallback) {
      this.onceCallback('writeCallback');
    }
    if (this.finalCallback && this.chunk.length() === 0) {
      this.onceCallback('finalCallback');
      this.push(null);
    }
  }
  onceCallback(method) {
    const callback = this[method];
    this[method] = null;
    callback();
  }
}

module.exports = ExpectChunkSizeTransformStream;
