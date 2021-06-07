(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './helper/svg'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./helper/svg'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.svg);
    global.focusSvgNegativeTabindexAttribute = mod.exports;
  }
})(this, function (module, exports, _svg) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    element: 'div',
    mutate: function mutate(element) {
      element.innerHTML = (0, _svg.generate)('<text tabindex="-1">a</text>');
      return element.querySelector('text');
    },
    validate: _svg.validate
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-svg-negative-tabindex-attribute.js.map