const { Client: Client6 } = require('es6');
const { Client: Client7 } = require('es7');

const QueueConsumerWriteStream = require('../QueueConsumerWriteStream');
const { retry } = require('../../utils');

class ElasticsearchWriteStream extends QueueConsumerWriteStream {
  constructor(
    { version = '7', clientConfig = {}, sendConfig = {}, ...args },
    ...resArgs
  ) {
    super({}, ...resArgs);
    Object.assign(this, {
      version,
      clientConfig,
      sendConfig,
      client: null,
      ...args,
    });
    this.init();
    this.consumeRetry = retry({
      func: async (...args) => {
        try {
          await this.consumeOnce(...args);
        } catch (err) {
          this.init();
          throw err;
        }
      },
      maxTryTime: 3,
    });
  }
  init() {
    const version = this.version || '';
    let client;
    if (version.startsWith('6')) {
      client = new Client6(this.clientConfig);
    } else if (version.startsWith('7')) {
      client = new Client7(this.clientConfig);
    } else {
      throw new Error(`unknown elasticsearch version: ${version}`);
    }
    Object.assign(this, {
      client,
    });
  }
  async _consume(params) {
    await this.consumeRetry(params);
  }
  async consumeOnce({ list }) {
    const body = [];
    const {
      index,
      _index,
      type,
      _type,
      idKey = '_id',
      ...args
    } = this.sendConfig;
    for (const item of list) {
      const { _id, ...params } = item;
      body.push(
        {
          index: {
            _index: _index || index,
            _type: _type || type, // WARNING: This parameter has been deprecated.
            _id: idKey && item[idKey] ? item[idKey] : null,
            ...args,
          },
        },
        params,
      );
    }
    const res = await this.client.bulk({
      body,
      refresh: false,
    });
    if (res.body && res.body.errors) {
      throw res.body;
    }
  }
}

module.exports = ElasticsearchWriteStream;
