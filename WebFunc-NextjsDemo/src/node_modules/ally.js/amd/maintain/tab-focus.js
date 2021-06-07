(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../is/active-element', '../query/tabsequence', '../when/key'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../is/active-element'), require('../query/tabsequence'), require('../when/key'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.activeElement, global.tabsequence, global.key);
    global.tabFocus = mod.exports;
  }
})(this, function (module, exports, _activeElement, _tabsequence, _key) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context;

    if (!context) {
      context = document.documentElement;
    }

    // Make sure the supports tests are run before intercepting the Tab key,
    // or IE10 and IE11 will fail to process the first Tab key event. Not
    // limiting this warm-up to IE because it may be a problem elsewhere, too.
    (0, _tabsequence2.default)();

    return (0, _key2.default)({
      // Safari on OSX may require ALT+TAB to reach links,
      // see https://github.com/medialize/ally.js/issues/146
      '?alt+?shift+tab': function altShiftTab(event) {
        // we're completely taking over the Tab key handling
        event.preventDefault();

        var sequence = (0, _tabsequence2.default)({
          context: context
        });

        var backward = event.shiftKey;
        var first = sequence[0];
        var last = sequence[sequence.length - 1];

        // wrap around first to last, last to first
        var source = backward ? first : last;
        var target = backward ? last : first;
        if ((0, _activeElement2.default)(source)) {
          target.focus();
          return;
        }

        // find current position in tabsequence
        var currentIndex = void 0;
        var found = sequence.some(function (element, index) {
          if (!(0, _activeElement2.default)(element)) {
            return false;
          }

          currentIndex = index;
          return true;
        });

        if (!found) {
          // redirect to first as we're not in our tabsequence
          first.focus();
          return;
        }

        // shift focus to previous/next element in the sequence
        var offset = backward ? -1 : 1;
        sequence[currentIndex + offset].focus();
      }
    });
  };

  var _activeElement2 = _interopRequireDefault(_activeElement);

  var _tabsequence2 = _interopRequireDefault(_tabsequence);

  var _key2 = _interopRequireDefault(_key);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=tab-focus.js.map