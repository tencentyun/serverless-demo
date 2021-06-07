'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pointerFocusChildren = require('./pointer-focus-children');

var _pointerFocusChildren2 = _interopRequireDefault(_pointerFocusChildren);

var _pointerFocusInput = require('./pointer-focus-input');

var _pointerFocusInput2 = _interopRequireDefault(_pointerFocusInput);

var _pointerFocusParent = require('./pointer-focus-parent');

var _pointerFocusParent2 = _interopRequireDefault(_pointerFocusParent);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  pointerFocusChildren: _pointerFocusChildren2.default,
  pointerFocusInput: _pointerFocusInput2.default,
  pointerFocusParent: _pointerFocusParent2.default
};
// exporting modules to be included the UMD bundle

module.exports = exports['default'];
//# sourceMappingURL=_fix.js.map