const { Transform } = require('stream');
const { getCamelCaseData } = require('../utils');

class Output {
  constructor({ consumer = 'COS', params = {}, cosUpload }) {
    Object.assign(this, {
      consumer,
      params,
      camelCaseParams: getCamelCaseData(params),
      cosUpload,
    });
  }
  getWriteStreamListAndPromiseList() {
    const transformStream = new Transform({
      readableObjectMode: true,
      writableObjectMode: true,
      transform(list, encoding, callback) {
        try {
          if (Array.isArray(list)) {
            const results = list.map((value) => {
              // if value is an object, try to stringify it
              if (Object.prototype.toString.call(value) === '[object Object]') {
                return JSON.stringify(value);
              }
              if (typeof value === 'string') {
                return value;
              }
              throw new Error(`unknown value type, value: ${value}, type: ${typeof value}`);
            });
            callback(null, results.length ? `${results.join('\n')}\n` : null);
          } else {
            callback(null, list.length ? list : null);
          }
        } catch (err) {
          callback(err);
        }
      },
    });
    const { objectConfig = {}, extraConfig = {} } = this.params;
    const promise = this.cosUpload.runTask({
      object: {
        ...objectConfig,
        ...extraConfig,
      },
      getReadStream: () => transformStream,
    });
    return {
      streamList: [transformStream],
      promiseList: [promise],
    };
  }
}

module.exports = Output;
