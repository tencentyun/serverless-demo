/* eslint-disable no-unused-vars */
const QueueConsumerWriteStream = require('../QueueConsumerWriteStream');

class CustomWriteStream extends QueueConsumerWriteStream {
  constructor(params, ...resArgs) {
    super({}, ...resArgs);
    Object.assign(this, {
      params,
    });
    this.init();
  }
  init() {
    /**
     * you can add initialization logic here
     */
  }
  async _consume({ list }) {
    /**
     * you can add consume logic here
     */
  }
  async _afterFinal(error) {
    /**
     * you can add final logic here
     * such as end the connection
     */
  }
}

module.exports = CustomWriteStream;
