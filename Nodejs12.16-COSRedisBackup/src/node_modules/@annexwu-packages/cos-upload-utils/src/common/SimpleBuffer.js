class SimpleBuffer {
  constructor() {
    Object.assign(this, {
      buffers: [],
      size: 0,
      maxQueueSize: 10000,
    });
  }
  length() {
    return this.size;
  }
  concat(buffer) {
    this.buffers.push(buffer);
    this.size += buffer.length;
    if (this.buffers.length >= this.maxQueueSize) {
      this.combine();
    }
  }
  slice(start, end) {
    this.combine();
    const [buffer] = this.buffers;
    const current = buffer.slice(start, end);
    const rest = buffer.slice(end);
    this.buffers = [rest];
    this.size = rest.length;
    return current;
  }
  combine() {
    const buffer = Buffer.concat(this.buffers, this.length());
    this.buffers = [buffer];
    this.size = buffer.length;
  }
}

module.exports = SimpleBuffer;
