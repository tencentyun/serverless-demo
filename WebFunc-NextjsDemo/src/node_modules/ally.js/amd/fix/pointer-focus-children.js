(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../get/focus-target', '../util/decorate-context', '../util/platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../get/focus-target'), require('../util/decorate-context'), require('../util/platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusTarget, global.decorateContext, global.platform);
    global.pointerFocusChildren = mod.exports;
  }
})(this, function (module, exports, _focusTarget, _decorateContext, _platform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _focusTarget2 = _interopRequireDefault(_focusTarget);

  var _decorateContext2 = _interopRequireDefault(_decorateContext);

  var _platform2 = _interopRequireDefault(_platform);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var engage = void 0; /*
                         Children of focusable elements with display:flex are focusable.
                         Because focus can be given to focusable (not tabbable) elements
                         by mouse, we have to counter this behavior, so the correct element
                         becomes the activeElement (i.e. receives focus).
                       
                         Example:
                           <div tabindex="-1" style="display:flex">
                             <span>I would receive focus</span>
                           </div>
                       
                         This (wrong) behavior was observed in Internet Explorer 10 and 11.
                         It is fixed in IE12 (Win10 IE Tec Preview)
                       */

  var disengage = void 0;
  // This fix is only relevant to IE10 (Trident/6) and IE11 (Trident/7)
  var relevantToCurrentBrowser = _platform2.default.is.TRIDENT && (_platform2.default.is.IE10 || _platform2.default.is.IE11);

  if (!relevantToCurrentBrowser) {
    engage = function engage() {};
  } else {
    (function () {
      var handleBeforeFocusEvent = function handleBeforeFocusEvent(event) {
        // find the element that would receive focus
        var target = (0, _focusTarget2.default)({
          context: event.target,
          except: {
            flexbox: true,
            scrollable: true
          }
        });

        if (!target || target === event.target) {
          // there's nothing to focus, or we're focusing the element clicked on
          return;
        }

        window.setImmediate(function () {
          target.focus();
        });

        // hide all children, because hidden elements can't get focus
        // remember previous element style (not necessarily computed style)
        // to undo hiding later. Reset transitions as well, in case visibility
        // is to be transitioned. This will effectively kill all transitions
        // that are executed on mousedown / :active
        var reverse = [].map.call(target.children, function (element) {
          var visibility = element.style.visibility || '';
          var transition = element.style.transition || '';
          element.style.visibility = 'hidden';
          element.style.transition = 'none';
          return [element, visibility, transition];
        });

        // add cleanup (undo hide) to the RunLoop
        window.setImmediate(function () {
          reverse.forEach(function (item) {
            item[0].style.visibility = item[1];
            item[0].style.transition = item[2];
          });
        });
      };

      engage = function engage(element) {
        // WebDriver does not reliably dispatch PointerEvents so we'll go with
        // mousedown, which shouldn't be a problem since we're targeting the
        // focus handling which immediately follows mousedown.
        element.addEventListener('mousedown', handleBeforeFocusEvent, true);
      };

      disengage = function disengage(element) {
        element.removeEventListener('mousedown', handleBeforeFocusEvent, true);
      };
    })();
  }

  exports.default = (0, _decorateContext2.default)({ engage: engage, disengage: disengage });
  module.exports = exports['default'];
});
//# sourceMappingURL=pointer-focus-children.js.map