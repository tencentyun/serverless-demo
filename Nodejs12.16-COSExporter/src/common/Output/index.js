const path = require('path');
const { Transform } = require('stream');
const { getCamelCaseData, replaceTemplate } = require('../utils');

const SpeedControlTransformStream = require('./SpeedControlTransformStream');

const KafkaWriteStream = require('./types/KafkaWriteStream');
const ElasticsearchWriteStream = require('./types/ElasticsearchWriteStream');
const CustomWriteStream = require('./types/CustomWriteStream');

class Output {
  constructor({
    consumer = 'Kafka',
    params = {},
    cosUpload,
    functionName,
    sourceList = [],
  }) {
    Object.assign(this, {
      consumer,
      params,
      camelCaseParams: getCamelCaseData(params),
      cosUpload,
      functionName,
      sourceList,
    });
  }
  getWriteStreamListAndPromiseList() {
    const { params, consumer } = this;
    const speedConfig = params.speedConfig || {};
    const speedControlTransformStream = new SpeedControlTransformStream(speedConfig);
    const promiseList = [];
    let consumerWriteStream;
    if (consumer === 'COS') {
      const { stream, promise } = this.getCosWriteStreamAndPromise();
      consumerWriteStream = stream;
      promiseList.push(promise);
    } else {
      consumerWriteStream = this.getNormalConsumerWriteStream();
    }
    return {
      streamList: [
        consumer === 'COS' ? null : speedControlTransformStream,
        consumerWriteStream,
      ].filter(Boolean),
      promiseList,
    };
  }
  getCosWriteStreamAndPromise() {
    const transformStream = new Transform({
      readableObjectMode: true,
      writableObjectMode: true,
      transform(list, encoding, callback) {
        try {
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
        } catch (err) {
          callback(err);
        }
      },
    });
    const firstSource = this.sourceList[0] || {};
    const { objectConfig = {}, extraConfig = {} } = this.params;
    const targetKey = this.getTargetKey({
      ...firstSource,
      ...objectConfig,
    });
    const { bucket, region } = firstSource;
    const { targetBucket, targetRegion } = objectConfig;
    const promise = this.cosUpload.runTask({
      object: {
        Bucket: targetBucket || bucket,
        Region: targetRegion || region,
        Key: targetKey,
        ...extraConfig,
      },
      getReadStream: () => transformStream,
    });
    return {
      stream: transformStream,
      promise,
    };
  }
  getNormalConsumerWriteStream() {
    const { consumer } = this;
    if (consumer === 'Kafka') {
      const { clientConfig, ...args } = this.camelCaseParams;
      return new KafkaWriteStream({
        clientConfig: {
          clientId: this.functionName,
          ...clientConfig,
        },
        ...args,
      });
    }

    if (consumer === 'Elasticsearch' || consumer === 'ES') {
      return new ElasticsearchWriteStream(this.params);
    }

    if (consumer === 'Custom') {
      return new CustomWriteStream(this.params);
    }

    throw new Error(`unknown consumer: ${consumer}`);
  }
  getTargetKey({
    bucket,
    region,
    key,
    relativePrefix = '',
    targetKey,
    targetKeyTemplate,
  }) {
    if (targetKey) {
      return targetKey;
    }
    if (!key.startsWith(relativePrefix)) {
      throw new Error(`object key(${key}) is not starts with relativePrefix(${relativePrefix})`);
    }
    const relativeKey = key.slice(relativePrefix.length);
    return replaceTemplate(targetKeyTemplate || '${Key}', {
      '${Bucket}': bucket,
      '${Region}': region,
      '${Key}': key,
      '${RelativeKey}': relativeKey,
      '${InputPath}': key.replace(/[^/]+$/, ''),
      '${RelativeInputPath}': relativeKey.replace(/[^/]+$/, ''),
      '${InputFullName}': path.basename(key),
      '${InputName}': path.basename(key, path.extname(key)),
      '${Ext}': path.extname(key),
    });
  }
}

module.exports = Output;
