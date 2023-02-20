/* eslint-disable no-underscore-dangle */
const { Duplex } = require('stream');

class CosSelectTransformStream extends Duplex {
  constructor(...args) {
    super(...args);
    this._readableState.sync = false;
    Object.assign(this, {
      chunk: Buffer.alloc(0),
      encoding: null,
      writeCallback: null,
      finalCallback: null,
      totalLength: 0, // current message block's total length
      headerLength: 0, // current message block's header length
      payloadRestLength: 0, // current message block's rest payload length
      header: null, // current message block's header
      flowing: true,
      ended: false,
    });
    // this.on('prefinish', () => this._final());
  }
  _read() {
    this.flowing = true;
    if (this.writeCallback || this.finalCallback) {
      this.consume();
    }
  }
  _write(chunk, encoding, callback) {
    if (
      process.env.debugMode
      && process.env.debugMode.includes('CosSelectTransformStream')
    ) {
      console.log('CosSelectTransformStream get writeCallback');
    }
    this.chunk = Buffer.concat(
      [this.chunk, chunk],
      this.chunk.length + chunk.length,
    );
    this.encoding = encoding;
    this.writeCallback = callback;
    this.consume();
  }
  _final(callback) {
    console.log('CosSelectTransformStream get finalCallback');
    this.finalCallback = callback;
    this.consume();
  }
  consume() {
    if (this.chunk.length === 0) {
      this.consumeCallback();
      return;
    }
    try {
      while (true) {
        if (!this.flowing) {
          return;
        }
        this.parseLength();
        if (!(this.totalLength && this.headerLength)) {
          break;
        }
        this.parseHeader();
        if (!this.header) {
          break;
        }
        this.parsePayload();
        if (this.chunk.length === 0) {
          break;
        } else if (
          this.totalLength > 0
          && this.chunk.length < this.payloadRestLength + 4
        ) {
          break;
        }
      }
      this.consumeCallback();
    } catch (err) {
      this.consumeCallback(err);
    }
  }
  consumeCallback(...args) {
    if (this.writeCallback) {
      if (
        process.env.debugMode
        && process.env.debugMode.includes('CosSelectTransformStream')
      ) {
        console.log('CosSelectTransformStream writeCallback');
      }
      this.onceCallback('writeCallback', ...args);
    }
    if (this.finalCallback && this.chunk.length === 0) {
      console.log('CosSelectTransformStream finalCallback');
      if (this.ended) {
        this.onceCallback('finalCallback', ...args);
        this.push(null);
      } else {
        this.onceCallback(
          'finalCallback',
          new Error('cos select stream final callback without end message'),
        );
        this.push(null);
      }
    }
  }
  onceCallback(method, ...args) {
    const callback = this[method];
    this[method] = null;
    callback(...args);
  }
  initNewMessageBlock() {
    Object.assign(this, {
      totalLength: 0,
      headerLength: 0,
      payloadRestLength: 0,
      header: null,
    });
  }
  /**
   * try to parse current message block's totalLength and headerLength
   */
  parseLength() {
    if (this.totalLength && this.headerLength) {
      return;
    }
    if (this.chunk.length >= 12) {
      this.totalLength = this.chunk.readInt32BE(0);
      this.headerLength = this.chunk.readInt32BE(4);
      this.payloadRestLength = this.totalLength - this.headerLength - 16;
      this.chunk = this.chunk.slice(12);
    }
  }
  /**
   * try to parse current message block's header
   * if header[':message-type'] is error, callback the error, emit error to next stream
   */
  parseHeader() {
    if (this.header) {
      return;
    }
    if (this.chunk.length >= this.headerLength) {
      const header = {};
      let offset = 0;
      while (offset < this.headerLength) {
        const headerNameLength = this.chunk[offset] * 1;
        const headerName = this.chunk.toString(
          'ascii',
          offset + 1,
          offset + 1 + headerNameLength,
        );
        const headerValueLength = this.chunk.readInt16BE(offset + headerNameLength + 2);
        const headerValue = this.chunk.toString(
          'ascii',
          offset + headerNameLength + 4,
          offset + headerNameLength + 4 + headerValueLength,
        );
        header[headerName] = headerValue;
        offset += headerNameLength + 4 + headerValueLength;
      }
      this.header = header;
      this.chunk = this.chunk.slice(this.headerLength);
      if (this.header[':message-type'] === 'error') {
        throw this.header;
      }
    }
  }
  /**
   * try to parse current message block's payload
   */
  parsePayload() {
    if (this.chunk.length >= this.payloadRestLength + 4) {
      const payload = this.chunk.slice(0, this.payloadRestLength);
      this.chunk = this.chunk.slice(this.payloadRestLength + 4);
      this.processData(payload);
      this.initNewMessageBlock();
    } else if (this.chunk.length < this.payloadRestLength) {
      const payload = this.chunk;
      this.chunk = Buffer.alloc(0);
      this.processData(payload);
      this.payloadRestLength -= payload.length;
    }
  }
  /**
   * if header[':event-type'] is Records, pipe payload to next stream
   */
  processData(content) {
    if (this.header[':event-type'] === 'Records') {
      this.flowing = this.push(content);
    } else if (this.header[':event-type'] === 'End') {
      this.ended = true;
    }
    this.emit('on-process-data', {
      header: this.header,
      content,
    });
  }
}

module.exports = CosSelectTransformStream;
