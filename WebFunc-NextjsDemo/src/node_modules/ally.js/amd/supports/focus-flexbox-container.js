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
    global.focusFlexboxContainer = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    element: 'span',
    mutate: function mutate(element) {
      element.setAttribute('style', 'display: -webkit-flex; display: -ms-flexbox; display: flex;');
      element.innerHTML = '<span style="display: block;">hello</span>';
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-flexbox-container.js.map