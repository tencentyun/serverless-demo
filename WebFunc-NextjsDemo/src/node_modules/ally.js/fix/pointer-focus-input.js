'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _focusTarget = require('../get/focus-target');

var _focusTarget2 = _interopRequireDefault(_focusTarget);

var _decorateContext = require('../util/decorate-context');

var _decorateContext2 = _interopRequireDefault(_decorateContext);

var _elementMatches = require('../util/element-matches');

var _elementMatches2 = _interopRequireDefault(_elementMatches);

var _platform = require('../util/platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
  Clicking on form field does not necessarily assign it focus in Safari and Firefox on Mac OS X.
  While not a browser bug, it may be considered undesired behavior.

  https://bugs.webkit.org/show_bug.cgi?id=22261
  https://bugs.webkit.org/show_bug.cgi?id=118043

  Note: This behavior can be turned off in Firefox by changing the
  option `accessibility.mouse_focuses_formcontrol` in about:config
*/

var engage = void 0;
var disengage = void 0;
// This fix is only relevant to Safari and Firefox on OSX
var relevantToCurrentBrowser = _platform2.default.is.OSX && (_platform2.default.is.GECKO || _platform2.default.is.WEBKIT);

if (!relevantToCurrentBrowser) {
  engage = function engage() {};
} else {
  (function () {
    var handleMouseDownEvent = function handleMouseDownEvent(event) {
      if (event.defaultPrevented || !(0, _elementMatches2.default)(event.target, 'input, button, button *')) {
        // abort if the mousedown event was cancelled,
        // or we're not dealing with an affected form control
        return;
      }

      var target = (0, _focusTarget2.default)({
        context: event.target
      });

      // we need to set focus AFTER the mousedown finished, otherwise WebKit will ignore the call
      (window.setImmediate || window.setTimeout)(function () {
        target.focus();
      });
    };

    var handleMouseUpEvent = function handleMouseUpEvent(event) {
      if (event.defaultPrevented || !(0, _elementMatches2.default)(event.target, 'label, label *')) {
        // abort if the mouseup event was cancelled,
        // or we're not dealing with a <label>
        return;
      }

      var target = (0, _focusTarget2.default)({
        context: event.target
      });

      if (!target) {
        return;
      }

      target.focus();
    };

    engage = function engage(element) {
      element.addEventListener('mousedown', handleMouseDownEvent, false);
      // <label> elements redirect focus upon mouseup, not mousedown
      element.addEventListener('mouseup', handleMouseUpEvent, false);
    };

    disengage = function disengage(element) {
      element.removeEventListener('mousedown', handleMouseDownEvent, false);
      element.removeEventListener('mouseup', handleMouseUpEvent, false);
    };
  })();
}

exports.default = (0, _decorateContext2.default)({ engage: engage, disengage: disengage });
module.exports = exports['default'];
//# sourceMappingURL=pointer-focus-input.js.map