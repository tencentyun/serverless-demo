(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement);
    global.parents = mod.exports;
  }
})(this, function (module, exports, _contextToElement) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context;

    var list = [];
    var element = (0, _contextToElement2.default)({
      label: 'get/parents',
      context: context
    });

    while (element) {
      list.push(element);
      // IE does know support parentElement on SVGElement
      element = element.parentNode;
      if (element && element.nodeType !== Node.ELEMENT_NODE) {
        element = null;
      }
    }

    return list;
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=parents.js.map