(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './focusable', '../is/tabbable'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./focusable'), require('../is/tabbable'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusable, global.tabbable);
    global.tabbable = mod.exports;
  }
})(this, function (module, exports, _focusable, _tabbable) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        includeContext = _ref.includeContext,
        includeOnlyTabbable = _ref.includeOnlyTabbable,
        strategy = _ref.strategy;

    var _isTabbable = _tabbable2.default.rules.except({
      onlyTabbable: includeOnlyTabbable
    });

    return (0, _focusable2.default)({
      context: context,
      includeContext: includeContext,
      includeOnlyTabbable: includeOnlyTabbable,
      strategy: strategy
    }).filter(_isTabbable);
  };

  var _focusable2 = _interopRequireDefault(_focusable);

  var _tabbable2 = _interopRequireDefault(_tabbable);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=tabbable.js.map