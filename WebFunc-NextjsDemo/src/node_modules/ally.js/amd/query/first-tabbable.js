(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/array-find-index', './tabbable', '../is/focusable', '../util/node-array'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/array-find-index'), require('./tabbable'), require('../is/focusable'), require('../util/node-array'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.arrayFindIndex, global.tabbable, global.focusable, global.nodeArray);
    global.firstTabbable = mod.exports;
  }
})(this, function (module, exports, _arrayFindIndex, _tabbable, _focusable, _nodeArray) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        sequence = _ref.sequence,
        strategy = _ref.strategy,
        ignoreAutofocus = _ref.ignoreAutofocus,
        defaultToContext = _ref.defaultToContext,
        includeOnlyTabbable = _ref.includeOnlyTabbable;

    var index = -1;

    if (!sequence) {
      context = (0, _nodeArray2.default)(context || document.body)[0];
      sequence = (0, _tabbable2.default)({
        context: context,
        includeOnlyTabbable: includeOnlyTabbable,
        strategy: strategy
      });
    }

    if (sequence.length && !ignoreAutofocus) {
      // prefer [autofocus]
      index = (0, _arrayFindIndex2.default)(sequence, hasAutofocus);
    }

    if (sequence.length && index === -1) {
      // ignore positive [tabindex]
      index = (0, _arrayFindIndex2.default)(sequence, hasNoPositiveTabindex);
    }

    var _isFocusable = _focusable2.default.rules.except({
      onlyTabbable: includeOnlyTabbable
    });

    if (index === -1 && defaultToContext && context && _isFocusable(context)) {
      return context;
    }

    return sequence[index] || null;
  };

  var _arrayFindIndex2 = _interopRequireDefault(_arrayFindIndex);

  var _tabbable2 = _interopRequireDefault(_tabbable);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  /*
      query/firstTabbable() finds the first suitable element to receive focus in the given context.
      If an element has [autofocus] return that element, otherwise return the first element
      in document order that does *not* have a positive tabIndex (e.g. as [tabindex="1"]),
      otherwise return the context itself, if it is focusable.
  
      Note: Chrome's <dialog> will focus the first tabbable element, even if it has
      [tabindex="1"]. Since [tabindex="1"] is considered
      bad practice we'll ignore it until someone complains.
   */

  function hasAutofocus(element) {
    // [autofocus] actually only works on form element, but who cares?
    return element.hasAttribute('autofocus');
  }

  function hasNoPositiveTabindex(element) {
    return element.tabIndex <= 0;
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=first-tabbable.js.map