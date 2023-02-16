/* eslint-disable arrow-body-style */
const AnalyzeTransformStream = require('../utils/AnalyzeTransformStream');

class InventoryAnalyzeTransformStream extends AnalyzeTransformStream {
  getPrefixList(key) {
    const hasDoubleQuotes =      key.startsWith('"') && key.endsWith('"') && key.length >= 2;
    if (hasDoubleQuotes) {
      key = key.replace(/^"|"$/g, '');
    }
    if (!key.includes('/')) {
      if (hasDoubleQuotes) {
        return ['""'];
      }
      return [''];
    }
    const dirs = key.split('/').slice(0, -1);
    return [
      '',
      ...dirs.map((dir, index) => dirs
        .slice(0, index + 1)
        .map(item => `${item}/`)
        .join('')),
    ].map((item) => {
      if (hasDoubleQuotes) {
        return `"${item}"`;
      }
      return item;
    });
  }
  getSuffix(key) {
    const hasDoubleQuotes =      key.startsWith('"') && key.endsWith('"') && key.length >= 2;
    if (hasDoubleQuotes) {
      key = key.replace(/^"|"$/g, '');
    }
    const fileName = key.split('/').pop();
    if (fileName.includes('.')) {
      if (hasDoubleQuotes) {
        return `".${fileName.split('.').pop()}"`;
      }
      return `.${fileName.split('.').pop()}`;
    }
    if (hasDoubleQuotes) {
      return '""';
    }
    return '';
  }
  getFullBucket({ Bucket, Appid }) {
    if (!Bucket || !Appid) {
      return Bucket;
    }
    const hasDoubleQuotes =      Bucket.startsWith('"') && Bucket.endsWith('"') && Bucket.length >= 2;
    Bucket = Bucket.replace(/^"|"$/g, '');
    Appid = Appid.replace(/^"|"$/g, '');
    if (Bucket && Appid && !Bucket.endsWith(`-${Appid}`)) {
      Bucket = `${Bucket}-${Appid}`;
    }
    if (hasDoubleQuotes) {
      return `"${Bucket}"`;
    }
    return Bucket;
  }
  _presetList(list) {
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
        let data = item;
        if (typeof item === 'string') {
          data = JSON.parse(item);
        }
        if (data.EncodedKey) {
          data.Key = decodeURIComponent(data.EncodedKey.replace(/\+/g, '%20'));
        }
        if (data.Bucket && data.Appid) {
          data.FullBucket = this.getFullBucket(data);
        }
        if (data.Key) {
          const prefixList = this.getPrefixList(data.Key);
          return prefixList.map((Prefix) => {
            return {
              ...data,
              Prefix,
              PrefixDepth: Math.max(Prefix.split('/').length - 1, 0),
              Suffix: this.getSuffix(data.Key),
            };
          });
        }
        return [data];
      });
    return results.reduce((res, item) => {
      res.push(...item);
      return res;
    }, []);
  }
}

module.exports = InventoryAnalyzeTransformStream;
