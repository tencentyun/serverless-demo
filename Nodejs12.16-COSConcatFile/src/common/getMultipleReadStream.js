const EventEmitter = require('events');
const { PassThrough } = require('stream');

module.exports = ({ getNextStream }) => {
  const passThrough = new PassThrough();
  const eventEmitter = new EventEmitter();
  let params = {};
  eventEmitter.on('next-stream', () => {
    const { nextParams, stream } = getNextStream(params) || {};
    if (!stream) {
      passThrough.end();
      return;
    }
    params = nextParams;
    stream.once('error', err => passThrough.emit('error', err));
    stream.once('end', () => eventEmitter.emit('next-stream'));
    stream.pipe(passThrough, { end: false });
  });
  process.nextTick(() => eventEmitter.emit('next-stream'));
  return passThrough;
};
