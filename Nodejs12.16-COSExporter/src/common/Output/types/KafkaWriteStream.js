/* eslint-disable no-param-reassign */
/* eslint-disable arrow-parens */
/* eslint-disable no-underscore-dangle */
const { Kafka } = require('kafkajs');
const QueueConsumerWriteStream = require('../QueueConsumerWriteStream');
const { retry } = require('../../utils');

class KafkaWriteStream extends QueueConsumerWriteStream {
  constructor(
    { clientConfig = {}, producerConfig = {}, sendConfig = {}, ...args },
    ...resArgs
  ) {
    super({}, ...resArgs);
    Object.assign(this, {
      clientConfig,
      producerConfig,
      sendConfig,
      client: null,
      producer: null,
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
    const client = new Kafka(this.clientConfig);
    const producer = client.producer(this.producerConfig);
    Object.assign(this, {
      client,
      producer,
    });
  }
  async _consume(params) {
    await this.consumeRetry(params);
  }
  async _afterFinal() {
    try {
      await this.producer.disconnect();
    } catch (err) {}
  }
  async consumeOnce({ list }) {
    await this.producer.connect();
    await this.producer.send({
      ...this.sendConfig,
      messages: this.getMessages(list),
    });
  }
  getMessages(list) {
    return list.map(value => {
      // if value is an object, try to stringify it
      if (Object.prototype.toString.call(value) === '[object Object]') {
        value = JSON.stringify(value);
      }
      return {
        value,
      };
    });
  }
}

module.exports = KafkaWriteStream;
