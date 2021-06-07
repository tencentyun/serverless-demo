'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (element) {
  if (!(0, _validTabindex2.default)(element)) {
    return null;
  }

  // Edge 14 has a capitalization problem on SVG elements,
  // see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9282058/
  var hasTabindex = element.hasAttribute('tabindex');
  var attributeName = hasTabindex ? 'tabindex' : 'tabIndex';

  // @browser-issue Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
  var tabindex = parseInt(element.getAttribute(attributeName), 10);
  return isNaN(tabindex) ? -1 : tabindex;
};

var _validTabindex = require('../is/valid-tabindex');

var _validTabindex2 = _interopRequireDefault(_validTabindex);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
//# sourceMappingURL=tabindex-value.js.map