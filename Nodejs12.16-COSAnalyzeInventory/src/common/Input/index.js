const zlib = require('zlib');
const unbzip2 = require('unbzip2-stream');
const { Readable } = require('stream');
const FileCache = require('./FileCache');
const getMultipleReadStream = require('./getMultipleReadStream');
const { tryAddCosSignature, parseUrl } = require('../utils');

const DataCacheTransformStream = require('./DataCacheTransformStream');
const CosRawLineTransformStream = require('./types/CosRawLineTransformStream');
const CosSelectTransformStream = require('./types/CosSelectTransformStream');
const CosNormalCsvTransformStream = require('./types/CosNormalCsvTransformStream');
const LineConsumerTransformStream = require('./LineConsumerTransformStream');

class Input {
  constructor({ cosSdkInstance, sourceList = [] }) {
    Object.assign(this, {
      cosSdkInstance,
      sourceList,
      fileCache: null,
    });
  }
  getReadStream() {
    return getMultipleReadStream({
      objectMode: true,
      getNextStream: async ({ index = 0 } = {}) => {
        const part = this.sourceList[index];
        if (!part) {
          return;
        }

        const {
          url,
          inputConfig = {
            extractor: 'CosRawLine',
            params: {
              Expression: 'NONE',
              ExpressionType: 'NONE',
              InputSerialization: {
                CompressionType: 'NONE',
                RecordDelimiter: '\n',
              },
            },
          },
        } = part;

        /**
         * extractor CosSelect
         */
        if (inputConfig.extractor === 'CosSelect') {
          const { bucket, region, key } = parseUrl(url);
          const { headers = {} } = await this.cosSdkInstance.headObject({
            Bucket: bucket,
            Region: region,
            Key: key,
          });
          const contentLength = headers['content-length'] * 1;
          let stream = new Readable({
            read() {
              this.push(null);
            },
          });
          if (contentLength > 0) {
            const dataCacheTransformStream = new DataCacheTransformStream({
              maxCacheSize: 300 * 1024 * 1024,
            });
            const cosSelectTransformStream = new CosSelectTransformStream();
            stream = this.cosSdkInstance
              .selectObjectContentStream({
                Bucket: bucket,
                Region: region,
                Key: key,
                DataType: 'raw',
                SelectType: '2',
                SelectRequest: {
                  Expression: 'Select * from COSObject',
                  ExpressionType: 'SQL',
                  InputSerialization: {
                    CompressionType: 'NONE',
                    CSV: {
                      FileHeaderInfo: 'IGNORE',
                      RecordDelimiter: '\n',
                      FieldDelimiter: ' ',
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
                  ...inputConfig.params,
                },
              })
              .on('error', err => dataCacheTransformStream.emit('error', err))
              .pipe(dataCacheTransformStream)
              .on('error', err => cosSelectTransformStream.emit('error', err))
              .pipe(cosSelectTransformStream);
          }
          const transformStream = new LineConsumerTransformStream({
            lineDelimiterList: ['\n', '\r\n'],
            getLineParams: content => content,
            filterLineParams: Boolean,
          });
          stream.on('error', err => transformStream.emit('error', err));
          return {
            nextParams: {
              index: index + 1,
            },
            stream: stream.pipe(transformStream),
          };
        }

        /**
         * extractor CosRawLine
         */
        if (
          inputConfig.extractor === 'CosRawLine'
          || inputConfig.extractor === 'CosNormalCsv'
        ) {
          const {
            /**
             * CosRawLine 参数
             */
            Expression = '',
            ExpressionType = '',
            InputSerialization: {
              CompressionType = 'NONE',
              RecordDelimiter = '\n',
              FieldDelimiter = ',',
              Columns = [],
            } = {},
          } = inputConfig.params;

          const signUrl = tryAddCosSignature({
            cosSdkInstance: this.cosSdkInstance,
            url,
          });

          if (!this.fileCache) {
            await this.initFileCache();
          }

          let stream = await this.fileCache.getReadStream({
            url: signUrl,
          });

          let decompressStream;
          if (CompressionType === 'GZIP') {
            decompressStream = zlib.createGunzip();
          } else if (CompressionType === 'BZIP2') {
            decompressStream = unbzip2();
          }

          if (decompressStream) {
            stream.on('error', err => decompressStream.emit('error', err));
            stream = stream.pipe(decompressStream);
          }

          let transformStream;

          if (inputConfig.extractor === 'CosRawLine') {
            transformStream = new CosRawLineTransformStream({
              recordDelimiter: RecordDelimiter,
              expressionType: ExpressionType,
              expression: Expression,
            });
          } else if (inputConfig.extractor === 'CosNormalCsv') {
            transformStream = new CosNormalCsvTransformStream({
              recordDelimiter: RecordDelimiter,
              columns: Columns,
              colDelimiter: FieldDelimiter,
            });
          }

          stream.on('error', err => transformStream.emit('error', err));

          return {
            nextParams: {
              index: index + 1,
            },
            stream: stream.pipe(transformStream),
          };
        }

        throw new Error(`unknown extractor: ${inputConfig.extractor}`);
      },
    });
  }
  async initFileCache() {
    this.fileCache = new FileCache({
      cachePath: '/tmp',
      maxCacheSize: 450 * 1024 * 1024,
      maxParallel: 2,
      minTruncateSize: 100 * 1024 * 1024,
    });
    await this.fileCache.init({
      fileList: this.sourceList.map(({ url, ...args }) => {
        const signUrl = tryAddCosSignature({
          cosSdkInstance: this.cosSdkInstance,
          url,
        });
        return {
          url: signUrl,
          ...args,
        };
      }),
    });
  }
}

module.exports = Input;
