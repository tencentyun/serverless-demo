(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './focusable', './key', './visible-area'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./focusable'), require('./key'), require('./visible-area'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusable, global.key, global.visibleArea);
    global._when = mod.exports;
  }
})(this, function (module, exports, _focusable, _key, _visibleArea) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _focusable2 = _interopRequireDefault(_focusable);

  var _key2 = _interopRequireDefault(_key);

  var _visibleArea2 = _interopRequireDefault(_visibleArea);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    focusable: _focusable2.default,
    key: _key2.default,
    visibleArea: _visibleArea2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_when.js.map