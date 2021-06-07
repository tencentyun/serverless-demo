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
    global.nodeArray = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (input) {
    if (!input) {
      return [];
    }

    if (Array.isArray(input)) {
      return input;
    }

    // instanceof Node - does not work with iframes
    if (input.nodeType !== undefined) {
      return [input];
    }

    if (typeof input === 'string') {
      input = document.querySelectorAll(input);
    }

    if (input.length !== undefined) {
      return [].slice.call(input, 0);
    }

    throw new TypeError('unexpected input ' + String(input));
  };

  module.exports = exports['default'];
});
//# sourceMappingURL=node-array.js.map