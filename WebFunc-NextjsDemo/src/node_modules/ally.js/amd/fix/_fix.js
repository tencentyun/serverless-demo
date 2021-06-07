(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './pointer-focus-children', './pointer-focus-input', './pointer-focus-parent'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./pointer-focus-children'), require('./pointer-focus-input'), require('./pointer-focus-parent'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.pointerFocusChildren, global.pointerFocusInput, global.pointerFocusParent);
    global._fix = mod.exports;
  }
})(this, function (module, exports, _pointerFocusChildren, _pointerFocusInput, _pointerFocusParent) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _pointerFocusChildren2 = _interopRequireDefault(_pointerFocusChildren);

  var _pointerFocusInput2 = _interopRequireDefault(_pointerFocusInput);

  var _pointerFocusParent2 = _interopRequireDefault(_pointerFocusParent);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    pointerFocusChildren: _pointerFocusChildren2.default,
    pointerFocusInput: _pointerFocusInput2.default,
    pointerFocusParent: _pointerFocusParent2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_fix.js.map