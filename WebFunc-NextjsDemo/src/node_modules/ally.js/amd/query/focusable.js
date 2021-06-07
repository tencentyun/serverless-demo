(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', './focusable.strict', './focusable.quick'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('./focusable.strict'), require('./focusable.quick'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.focusable, global.focusable);
    global.focusable = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _focusable, _focusable3) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        includeContext = _ref.includeContext,
        includeOnlyTabbable = _ref.includeOnlyTabbable,
        _ref$strategy = _ref.strategy,
        strategy = _ref$strategy === undefined ? 'quick' : _ref$strategy;

    var element = (0, _contextToElement2.default)({
      label: 'query/focusable',
      resolveDocument: true,
      defaultToDocument: true,
      context: context
    });

    var options = {
      context: element,
      includeContext: includeContext,
      includeOnlyTabbable: includeOnlyTabbable,
      strategy: strategy
    };

    if (strategy === 'quick') {
      return (0, _focusable4.default)(options);
    } else if (strategy === 'strict' || strategy === 'all') {
      return (0, _focusable2.default)(options);
    }

    throw new TypeError('query/focusable requires option.strategy to be one of ["quick", "strict", "all"]');
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _focusable4 = _interopRequireDefault(_focusable3);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=focusable.js.map