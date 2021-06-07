(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.platform);
    global.focusInZeroDimensionObject = mod.exports;
  }
})(this, function (module, exports, _platform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    return result;
  };

  var _platform2 = _interopRequireDefault(_platform);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var result = !_platform2.default.is.WEBKIT;

  module.exports = exports['default'];
});
//# sourceMappingURL=focus-in-zero-dimension-object.js.map