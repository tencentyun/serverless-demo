/* eslint-disable arrow-body-style */
const { Transform } = require('stream');

class CustomTransformStream extends Transform {
  constructor(params = {}, ...resArgs) {
    super(
      {
        readableObjectMode: true,
        writableObjectMode: true,
      },
      ...resArgs,
    );
    Object.assign(this, {
      params,
    });
  }
  _transform(list, encoding, callback) {
    try {
      const results = list
        .filter((item) => {
          /**
           * add your filter logic here
           */
          return Boolean(item);
        })
        .map((item) => {
          /**
           * add your transform logic here
           */
          return item;
        });
      callback(null, results.length ? results : null);
    } catch (err) {
      callback(err);
    }
  }
  _flush(callback) {
    callback();
  }
}

module.exports = CustomTransformStream;
