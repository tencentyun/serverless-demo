/* eslint-disable no-param-reassign */
const { streamPipelinePromise } = require('./utils');
const { Readable, PassThrough } = require('stream');
const Input = require('./Input/index');
const Filter = require('./Filter/index');
const Output = require('./Output/index');

class CosAnalyzeInventoryProcessTask {
  constructor({
    cosSdkInstance,
    cosUpload,
    bucket,
    region,
    key,
    analyzeConfig,
    sourceList,
  }) {
    const analyzeConfigColumns = analyzeConfig.columns.map(item => item.key);
    sourceList = sourceList.map((item) => {
      const {
        type,
        fileFormat = 'CSV',
        fileSchema,
        fileHeaderInfo = 'NONE',
        fieldDelimiter,
      } = item;
      let inputConfig = {};
      if (fileFormat === 'CSV') {
        let columns = [];
        if (fileSchema) {
          columns = fileSchema
            .split(',')
            .map(key => key.trim())
            .map(key => (key === 'Key' ? 'EncodedKey' : key));
        } else {
          columns = analyzeConfigColumns;
        }
        const unsetKeys = analyzeConfigColumns.filter(key => !columns.includes(key)
            && !['Prefix', 'PrefixDepth', 'Key', 'EncodedKey'].includes(key));
        if (unsetKeys.length > 0) {
          throw new Error(`${unsetKeys.join(', ')} has not found in file`);
        }
        if (analyzeConfig.inputExtractor === 'CosSelect') {
          inputConfig = {
            extractor: 'CosSelect',
            params: {
              Expression: `Select ${columns
                .map((item, index) => `_${index + 1} as ${item === 'Key' ? 'EncodedKey' : item}`)
                .join(', ')} from COSObject`,
              ExpressionType: 'SQL',
              InputSerialization: {
                CompressionType: type === 'gzip' ? 'GZIP' : 'NONE',
                CSV: {
                  FileHeaderInfo: fileHeaderInfo,
                  RecordDelimiter: '\n',
                  FieldDelimiter:
                    fieldDelimiter || analyzeConfig.colDelimiter || ',',
                  QuoteCharacter: '"',
                  QuoteEscapeCharacter: '"',
                  AllowQuotedRecordDelimiter: 'TRUE',
                },
              },
              OutputSerialization: {
                JSON: {
                  RecordDelimiter: '\n',
                },
              },
              ...(analyzeConfig.cosSelect || {}),
            },
          };
        } else {
          inputConfig = {
            extractor: 'CosNormalCsv',
            params: {
              InputSerialization: {
                RecordDelimiter: '\n',
                FieldDelimiter:
                  fieldDelimiter || analyzeConfig.colDelimiter || ',',
                Columns: analyzeConfig.columns || columns.map(key => ({ key })),
                CompressionType: type === 'gzip' ? 'GZIP' : 'NONE',
              },
            },
          };
        }
      }
      return {
        ...item,
        inputConfig,
      };
    });
    Object.assign(this, {
      cosSdkInstance,
      cosUpload,
      bucket,
      region,
      key,
      analyzeConfig,
      sourceList,
    });
  }
  async runTask() {
    const input = new Input({
      cosSdkInstance: this.cosSdkInstance,
      sourceList: this.sourceList,
    });
    const readStream = input.getReadStream();
    const filter = new Filter({
      filter: 'InventoryAnalyzeTransformStream',
      params: {
        ...this.analyzeConfig,
        destroySource: () => readStream.end(),
      },
    });
    const output = new Output({
      cosUpload: this.cosUpload,
      consumer: 'COS',
      params: {
        objectConfig: {
          Bucket: this.bucket,
          Region: this.region,
          Key: this.key,
        },
        extraConfig: {},
      },
    });
    const passThrough = new PassThrough();
    await this.targetSetHeader(passThrough);
    const { streamList, promiseList } =      output.getWriteStreamListAndPromiseList();
    const result = await Promise.all([
      streamPipelinePromise([
        readStream,
        filter.getTransformStream(),
        passThrough,
      ]),
      streamPipelinePromise([passThrough, ...streamList]),
      ...promiseList,
    ]);
    return result.pop();
  }
  async targetSetHeader(passThrough) {
    const {
      select,
      targetRowDelimiter = '\n',
      targetColDelimiter = ',',
      targetSetHeader = true,
    } = this.analyzeConfig;
    if (!targetSetHeader) {
      return;
    }
    const headerStr =      select.map(({ label, key }) => label || key).join(targetColDelimiter)
      + targetRowDelimiter;
    Readable.from([headerStr]).pipe(passThrough, { end: false });
  }
}

module.exports = CosAnalyzeInventoryProcessTask;
