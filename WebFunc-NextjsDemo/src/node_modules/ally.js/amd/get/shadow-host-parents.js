(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './shadow-host', '../util/context-to-element'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./shadow-host'), require('../util/context-to-element'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.shadowHost, global.contextToElement);
    global.shadowHostParents = mod.exports;
  }
})(this, function (module, exports, _shadowHost, _contextToElement) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context;

    var list = [];
    var element = (0, _contextToElement2.default)({
      label: 'get/shadow-host-parents',
      context: context
    });

    while (element) {
      element = (0, _shadowHost2.default)({ context: element });
      if (!element) {
        break;
      }

      list.push(element);
    }

    return list;
  };

  var _shadowHost2 = _interopRequireDefault(_shadowHost);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=shadow-host-parents.js.map