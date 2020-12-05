'use strict'

var iconv = require('iconv-lite');
var jconv = require('jconv');
var encodings = require('./encodings.js');


var mappings = {
  'euc-jp': 'eucjp',
  'shift_jis': 'sjis',
  'utf-16le': 'utf16le',
  'ucs-2': 'ucs2'

};
var jconvEncodings = [
  'iso-2022-jp',
  'iso-2022-jp-1',
  'iso2022jp',
  'jis',
  'unicode'
];

exports.labels = encodings.map(function (enc) {
  return enc.labels;
}).concat(Object.keys(require('iconv-lite/encodings'))).reduce(function (acc, next) {
  return acc.concat(next);
}, []).filter(function (enc) {
  return enc[0] !== '_';
}).concat(jconvEncodings).concat(Object.keys(mappings)).sort();
exports.labels = exports.labels.filter(function (enc, i) {
  return exports.labels[i - 1] != enc;
});

exports.decode = decode;
function decode(source, encoding, options) {
  if (encoding in mappings) encoding = mappings[encoding];
  if (iconv.encodingExists(encoding)) {
    return iconv.decode(source, encoding);
  }
  if (jconv.encodingExists(encoding)) {
    return jconv.decode(source, encoding);
  }
  for (var i = 0; i < encodings.length; i++) {
    if (encodings[i].labels.indexOf(encoding) !== -1) {
      return encodings[i].decode(source.toString('binary'), options);
    }
  }
  throw new TypeError('Unknown encoding: ' + JSON.stringify(encoding));
}
exports.encode = encode;
function encode(source, encoding, options) {
  if (encoding in mappings) encoding = mappings[encoding];
  if (iconv.encodingExists(encoding)) {
    return iconv.encode(source, encoding);
  }
  if (jconv.encodingExists(encoding)) {
    return jconv.encode(source, encoding);
  }
  for (var i = 0; i < encodings.length; i++) {
    if (encodings[i].labels.indexOf(encoding) !== -1) {
      return new Buffer(encodings[i].encode(source, options), 'binary');
    }
  }
  throw new TypeError('Unknown encoding: ' + JSON.stringify(encoding));
}
