(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports);
    global.logger = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var noop = function noop() {};
  var _console = {
    log: noop,
    debug: noop,
    info: noop,
    warn: noop,
    error: noop
  };

  exports.default = typeof console !== 'undefined' ? console : _console;
  module.exports = exports['default'];
});
//# sourceMappingURL=logger.js.map