(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../get/focus-target', '../is/valid-tabindex', '../util/decorate-context', '../util/platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../get/focus-target'), require('../is/valid-tabindex'), require('../util/decorate-context'), require('../util/platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusTarget, global.validTabindex, global.decorateContext, global.platform);
    global.pointerFocusParent = mod.exports;
  }
})(this, function (module, exports, _focusTarget, _validTabindex, _decorateContext, _platform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _focusTarget2 = _interopRequireDefault(_focusTarget);

  var _validTabindex2 = _interopRequireDefault(_validTabindex);

  var _decorateContext2 = _interopRequireDefault(_decorateContext);

  var _platform2 = _interopRequireDefault(_platform);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  /*
    Clicking on a link that has a focusable element in its ancestry [tabindex="-1"],
    can lead to that parental element gaining focus, instead of the link.
  
    Example:
      <div tabindex="-1">
        <a href="#foo">click me</a>
      </div>
  
    This (wrong) behavior was observed in Chrome 38, iOS8, Safari 6.2, WebKit r175131
    It is not a problem in Firefox 33, Internet Explorer 11, Chrome 39.
  */

  var engage = void 0;
  var disengage = void 0;
  // This fix is only relevant to WebKit
  var relevantToCurrentBrowser = _platform2.default.is.WEBKIT;

  if (!relevantToCurrentBrowser) {
    engage = function engage() {};
  } else {
    (function () {
      // add [tabindex="0"] to the (focusable) element that is about to be clicked
      // if it does not already have an explicit tabindex (attribute).
      // By applying an explicit tabindex, WebKit will not go look for
      // the first valid tabindex in the element's parents.
      var handleBeforeFocusEvent = function handleBeforeFocusEvent(event) {
        // find the element that would receive focus
        var target = (0, _focusTarget2.default)({ context: event.target });
        if (!target || target.hasAttribute('tabindex') && (0, _validTabindex2.default)(target)) {
          // there's nothing to focus, or the element already has tabindex, we're good
          return;
        }

        // assign explicit tabindex, as implicit tabindex is the problem
        target.setAttribute('tabindex', 0);

        // add cleanup to the RunLoop
        (window.setImmediate || window.setTimeout)(function () {
          target.removeAttribute('tabindex');
        }, 0);
      };

      engage = function engage(element) {
        element.addEventListener('mousedown', handleBeforeFocusEvent, true);
        element.addEventListener('touchstart', handleBeforeFocusEvent, true);
      };

      disengage = function disengage(element) {
        element.removeEventListener('mousedown', handleBeforeFocusEvent, true);
        element.removeEventListener('touchstart', handleBeforeFocusEvent, true);
      };
    })();
  }

  exports.default = (0, _decorateContext2.default)({ engage: engage, disengage: disengage });
  module.exports = exports['default'];
});
//# sourceMappingURL=pointer-focus-parent.js.map