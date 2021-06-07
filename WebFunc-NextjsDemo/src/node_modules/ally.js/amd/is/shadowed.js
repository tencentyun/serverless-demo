(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', '../get/shadow-host'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('../get/shadow-host'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.shadowHost);
    global.shadowed = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _shadowHost) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context) {
    var element = (0, _contextToElement2.default)({
      label: 'is/shadowed',
      resolveDocument: true,
      context: context
    });

    return Boolean((0, _shadowHost2.default)({ context: element }));
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _shadowHost2 = _interopRequireDefault(_shadowHost);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=shadowed.js.map