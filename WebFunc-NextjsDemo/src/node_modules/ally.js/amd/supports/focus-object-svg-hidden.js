(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './media/svg'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./media/svg'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.svg);
    global.focusObjectSvgHidden = mod.exports;
  }
})(this, function (module, exports, _svg) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _svg2 = _interopRequireDefault(_svg);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    element: 'object',
    mutate: function mutate(element) {
      element.setAttribute('type', 'image/svg+xml');
      element.setAttribute('data', _svg2.default);
      element.setAttribute('width', '200');
      element.setAttribute('height', '50');
      element.style.visibility = 'hidden';
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-object-svg-hidden.js.map