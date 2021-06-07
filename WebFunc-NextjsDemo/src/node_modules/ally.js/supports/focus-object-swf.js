'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  return result;
};

var _platform = require('../util/platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Every Environment except IE9 considers SWF objects focusable
var result = !_platform2.default.is.IE9;

module.exports = exports['default'];
//# sourceMappingURL=focus-object-swf.js.map