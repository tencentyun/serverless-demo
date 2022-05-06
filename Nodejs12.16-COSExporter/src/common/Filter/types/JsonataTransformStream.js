/* eslint-disable no-param-reassign */
const { Transform } = require('stream');
const jsonata = require('jsonata');

class JsonataTransformStream extends Transform {
  constructor({ expression = 'NONE', ...args }, ...resArgs) {
    super(
      {
        readableObjectMode: true,
        writableObjectMode: true,
        ...args,
      },
      ...resArgs,
    );
    Object.assign(this, {
      expression,
      query: expression && expression !== 'NONE' ? jsonata(expression) : null,
    });
  }
  _transform(list, encoding, callback) {
    try {
      const results = list
        .map((data) => {
          try {
            data = JSON.parse(data);
          } catch (err) {}
          if (this.query) {
            try {
              const result = this.query.evaluate({ data });
              return result || null;
            } catch (err) {
              return null;
            }
          }
          return data;
        })
        .filter(Boolean);
      callback(null, results.length ? results : null);
    } catch (err) {
      callback(err);
    }
  }
  _flush(callback) {
    callback();
  }
}

module.exports = JsonataTransformStream;
