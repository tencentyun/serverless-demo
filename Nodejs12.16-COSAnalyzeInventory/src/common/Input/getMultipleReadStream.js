const EventEmitter = require('events');
const { PassThrough } = require('stream');

module.exports = ({ getNextStream, objectMode = false }) => {
  const passThrough = new PassThrough(objectMode
    ? {
      readableObjectMode: true,
      writableObjectMode: true,
    }
    : {});
  const eventEmitter = new EventEmitter();
  let params = {};
  eventEmitter.on('next-stream', async () => {
    try {
      const nextStream = await getNextStream(params);
      const { nextParams, stream } = nextStream || {};
      if (!stream) {
        passThrough.end();
        return;
      }
      params = nextParams;
      stream.once('error', err => passThrough.emit('error', err));
      stream.once('end', () => eventEmitter.emit('next-stream'));
      stream.pipe(passThrough, { end: false });
    } catch (err) {
      passThrough.emit('error', err);
    }
  });
  process.nextTick(() => eventEmitter.emit('next-stream'));
  return passThrough;
};
