'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _focusSource = require('./focus-source');

var _focusSource2 = _interopRequireDefault(_focusSource);

var _focusWithin = require('./focus-within');

var _focusWithin2 = _interopRequireDefault(_focusWithin);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// exporting modules to be included the UMD bundle

exports.default = {
  focusSource: _focusSource2.default,
  focusWithin: _focusWithin2.default
};
module.exports = exports['default'];
//# sourceMappingURL=_style.js.map