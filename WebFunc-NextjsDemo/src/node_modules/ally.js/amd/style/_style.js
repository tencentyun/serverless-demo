(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './focus-source', './focus-within'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./focus-source'), require('./focus-within'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusSource, global.focusWithin);
    global._style = mod.exports;
  }
})(this, function (module, exports, _focusSource, _focusWithin) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _focusSource2 = _interopRequireDefault(_focusSource);

  var _focusWithin2 = _interopRequireDefault(_focusWithin);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    focusSource: _focusSource2.default,
    focusWithin: _focusWithin2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_style.js.map