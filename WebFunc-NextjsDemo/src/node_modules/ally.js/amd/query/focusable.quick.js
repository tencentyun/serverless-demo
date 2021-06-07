(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../selector/focusable', '../is/focusable'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../selector/focusable'), require('../is/focusable'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusable, global.focusable);
    global.focusableQuick = mod.exports;
  }
})(this, function (module, exports, _focusable, _focusable3) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = queryFocusableQuick;

  var _focusable2 = _interopRequireDefault(_focusable);

  var _focusable4 = _interopRequireDefault(_focusable3);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // https://www.w3.org/TR/html5/editing.html#focusable
  // https://www.w3.org/WAI/PF/aria-practices/#keyboard

  function queryFocusableQuick() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        includeContext = _ref.includeContext,
        includeOnlyTabbable = _ref.includeOnlyTabbable;

    var _selector = (0, _focusable2.default)();
    var elements = context.querySelectorAll(_selector);
    // the selector potentially matches more than really is focusable

    var _isFocusable = _focusable4.default.rules.except({
      onlyTabbable: includeOnlyTabbable
    });

    var result = [].filter.call(elements, _isFocusable);

    // add context if requested and focusable
    if (includeContext && _isFocusable(context)) {
      result.unshift(context);
    }

    return result;
  }
  module.exports = exports['default'];
});
//# sourceMappingURL=focusable.quick.js.map