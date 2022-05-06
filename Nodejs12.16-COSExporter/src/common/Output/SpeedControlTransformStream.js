/* eslint-disable no-underscore-dangle */
const { Duplex } = require('stream');

class SpeedControlTransformStream extends Duplex {
  constructor(
    { countLimit = 1000, duration = 10 * 1000, ...args },
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
    this._readableState.sync = false;
    Object.assign(this, {
      writeCallback: null,
      finalCallback: null,
      flowing: true,
      queue: [],
      countLimit,
      duration,
      currentCount: 0,
      timer: null,
    });
    // this.on('prefinish', () => this._final());
  }
  _read() {
    this.flowing = true;
    if (this.writeCallback || this.finalCallback) {
      this.consume();
    }
  }
  _write(list, encoding, callback) {
    if (
      process.env.debugMode
      && process.env.debugMode.includes('SpeedControlTransformStream')
    ) {
      console.log('SpeedControlTransformStream get writeCallback');
    }
    list.forEach(item => this.queue.push(item));
    this.writeCallback = callback;
    this.consume();
  }
  _final(callback) {
    console.log('SpeedControlTransformStream get finalCallback');
    this.finalCallback = callback;
    this.consume();
  }
  consume() {
    if (this.queue.length === 0) {
      this.consumeCallback();
      return;
    }
    try {
      while (true) {
        if (!this.flowing) {
          return;
        }
        const restCount = Math.min(
          this.countLimit - this.currentCount,
          this.queue.length,
        );
        if (restCount === 0) {
          return;
        }
        if (this.timer === undefined || this.timer === null) {
          this.timer = setTimeout(() => {
            this.timer = null;
            this.currentCount = 0;
            this.consume();
          }, this.duration);
        }
        const list = this.queue.splice(0, restCount);
        this.currentCount += list.length;
        this.flowing = this.push({ list });
        if (this.queue.length === 0) {
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
        && process.env.debugMode.includes('SpeedControlTransformStream')
      ) {
        console.log('SpeedControlTransformStream writeCallback');
      }
      this.onceCallback('writeCallback', ...args);
    }
    if (this.finalCallback && this.queue.length === 0) {
      console.log('SpeedControlTransformStream finalCallback');
      this.onceCallback('finalCallback', ...args);
      this.push(null);
    }
  }
  onceCallback(method, ...args) {
    const callback = this[method];
    this[method] = null;
    callback(...args);
  }
}

module.exports = SpeedControlTransformStream;
