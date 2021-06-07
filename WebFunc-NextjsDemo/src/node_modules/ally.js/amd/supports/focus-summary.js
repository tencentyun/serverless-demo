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
    global.focusSummary = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    element: 'details',
    mutate: function mutate(element) {
      element.innerHTML = '<summary>foo</summary><p>content</p>';
      return element.firstElementChild;
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-summary.js.map