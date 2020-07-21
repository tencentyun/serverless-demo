import { FORMAT_DEFAULT } from '../../constant';
export default (function (o, c, d) {
  var proto = c.prototype;
  var oldFormat = proto.format;
  var englishFormats = {
    LTS: 'h:mm:ss A',
    LT: 'h:mm A',
    L: 'MM/DD/YYYY',
    LL: 'MMMM D, YYYY',
    LLL: 'MMMM D, YYYY h:mm A',
    LLLL: 'dddd, MMMM D, YYYY h:mm A'
  };
  d.en.formats = englishFormats;

  proto.format = function (formatStr) {
    var locale = this.$locale();
    var formats = locale.formats || {};
    var str = formatStr || FORMAT_DEFAULT;
    var result = str.replace(/LTS|LT|L{1,4}/g, function (match) {
      return formats[match] || englishFormats[match];
    });
    return oldFormat.call(this, result);
  };
});