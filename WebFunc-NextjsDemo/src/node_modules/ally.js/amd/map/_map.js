(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './attribute', './keycode'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./attribute'), require('./keycode'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.attribute, global.keycode);
    global._map = mod.exports;
  }
})(this, function (module, exports, _attribute, _keycode) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _attribute2 = _interopRequireDefault(_attribute);

  var _keycode2 = _interopRequireDefault(_keycode);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    attribute: _attribute2.default,
    keycode: _keycode2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_map.js.map