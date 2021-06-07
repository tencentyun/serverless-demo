(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './media/gif.invalid'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./media/gif.invalid'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.gif);
    global.focusBrokenImageMap = mod.exports;
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

  exports.default = {
    element: 'div',
    mutate: function mutate(element) {
      element.innerHTML = '<map name="broken-image-map-test"><area href="#void" shape="rect" coords="63,19,144,45"></map>' + '<img usemap="#broken-image-map-test" alt="" src="' + _gif2.default + '">';

      return element.querySelector('area');
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-broken-image-map.js.map