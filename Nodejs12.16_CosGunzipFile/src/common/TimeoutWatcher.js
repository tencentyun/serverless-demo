class TimeoutWatcher {
  constructor({
    timeLimit = 0,
    trigger = () => null,
    reserve = 20 * 1000,
    error = new Error('timeout'),
  }) {
    const duration = timeLimit - reserve;
    if (duration <= 0) {
      throw new Error(`time limit can not less than ${reserve / 1000} seconds`);
    }
    Object.assign(this, {
      timeout: false,
      timer: setTimeout(() => {
        this.timeout = true;
        clearTimeout(this.timer);
        trigger(error);
      }, duration),
      error,
    });
  }
  isTimeout() {
    return this.timeout;
  }
  clear() {
    clearTimeout(this.timer);
  }
}

module.exports = TimeoutWatcher;
