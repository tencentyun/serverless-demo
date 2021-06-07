(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './blur', './disabled', './focus'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./blur'), require('./disabled'), require('./focus'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.blur, global.disabled, global.focus);
    global._element = mod.exports;
  }
})(this, function (module, exports, _blur, _disabled, _focus) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _blur2 = _interopRequireDefault(_blur);

  var _disabled2 = _interopRequireDefault(_disabled);

  var _focus2 = _interopRequireDefault(_focus);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    blur: _blur2.default,
    disabled: _disabled2.default,
    focus: _focus2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_element.js.map