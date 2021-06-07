(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './media/gif', '../util/platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./media/gif'), require('../util/platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.gif, global.platform);
    global.focusAreaWithoutHref = mod.exports;
  }
})(this, function (module, exports, _gif, _platform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _gif2 = _interopRequireDefault(_gif);

  var _platform2 = _interopRequireDefault(_platform);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    element: 'div',
    mutate: function mutate(element) {
      element.innerHTML = '<map name="image-map-area-href-test">' + '<area shape="rect" coords="63,19,144,45"></map>' + '<img usemap="#image-map-area-href-test" alt="" src="' + _gif2.default + '">';

      return element.querySelector('area');
    },
    validate: function validate(element, focusTarget, _document) {
      if (_platform2.default.is.GECKO) {
        // fixes https://github.com/medialize/ally.js/issues/35
        // Firefox loads the DataURI asynchronously, causing a false-negative
        return true;
      }

      return _document.activeElement === focusTarget;
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-area-without-href.js.map