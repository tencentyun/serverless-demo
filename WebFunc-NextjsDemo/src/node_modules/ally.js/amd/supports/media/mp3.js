(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './gif'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./gif'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.gif);
    global.mp3 = mod.exports;
  }
})(this, function (module, exports, _gif) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _gif2 = _interopRequireDefault(_gif);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = _gif2.default;
  module.exports = exports['default'];
});
//# sourceMappingURL=mp3.js.map