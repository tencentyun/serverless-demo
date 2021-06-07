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
    global.focusSvgUseTabindex = mod.exports;
  }
})(this, function (module, exports, _svg) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    element: 'div',
    mutate: function mutate(element) {
      element.innerHTML = (0, _svg.generate)(['<g id="ally-test-target"><a xlink:href="#void"><text>link</text></a></g>', '<use xlink:href="#ally-test-target" x="0" y="0" tabindex="-1" />'].join(''));

      return element.querySelector('use');
    },
    validate: _svg.validate
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-svg-use-tabindex.js.map