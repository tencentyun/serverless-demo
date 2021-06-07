(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './media/svg', '../util/platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./media/svg'), require('../util/platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.svg, global.platform);
    global.focusObjectSvg = mod.exports;
  }
})(this, function (module, exports, _svg, _platform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _svg2 = _interopRequireDefault(_svg);

  var _platform2 = _interopRequireDefault(_platform);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    name: 'can-focus-object-svg',
    element: 'object',
    mutate: function mutate(element) {
      element.setAttribute('type', 'image/svg+xml');
      element.setAttribute('data', _svg2.default);
      element.setAttribute('width', '200');
      element.setAttribute('height', '50');
    },
    validate: function validate(element, focusTarget, _document) {
      if (_platform2.default.is.GECKO) {
        // Firefox seems to be handling the object creation asynchronously and thereby produces a false negative test result.
        // Because we know Firefox is able to focus object elements referencing SVGs, we simply cheat by sniffing the user agent string
        return true;
      }

      return _document.activeElement === element;
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-object-svg.js.map