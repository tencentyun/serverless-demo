(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './active-element', './shadow-focus'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./active-element'), require('./shadow-focus'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.activeElement, global.shadowFocus);
    global._event = mod.exports;
  }
})(this, function (module, exports, _activeElement, _shadowFocus) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _activeElement2 = _interopRequireDefault(_activeElement);

  var _shadowFocus2 = _interopRequireDefault(_shadowFocus);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    activeElement: _activeElement2.default,
    shadowFocus: _shadowFocus2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_event.js.map