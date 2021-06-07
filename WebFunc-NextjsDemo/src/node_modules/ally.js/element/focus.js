'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (context) {
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      defaultToAncestor = _ref.defaultToAncestor,
      undoScrolling = _ref.undoScrolling;

  var element = (0, _contextToElement2.default)({
    label: 'element/focus',
    context: context
  });

  var targetIsFocusable = _focusable2.default.rules({
    context: element,
    except: except
  });

  if (!defaultToAncestor && !targetIsFocusable) {
    return null;
  }

  var target = (0, _focusTarget2.default)({
    context: element,
    except: except
  });

  if (!target) {
    return null;
  }

  if ((0, _activeElement2.default)(target)) {
    return target;
  }

  var _undoScrolling = void 0;
  if (undoScrolling) {
    _undoScrolling = (0, _resetScrolling2.default)(target);
  }

  var result = focus(target);

  _undoScrolling && _undoScrolling();

  return result;
};

var _focus = require('./focus.svg-foreign-object-hack');

var _focus2 = _interopRequireDefault(_focus);

var _focusTarget = require('../get/focus-target');

var _focusTarget2 = _interopRequireDefault(_focusTarget);

var _activeElement = require('../is/active-element');

var _activeElement2 = _interopRequireDefault(_activeElement);

var _focusable = require('../is/focusable');

var _focusable2 = _interopRequireDefault(_focusable);

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _getWindow = require('../util/get-window');

var _getWindow2 = _interopRequireDefault(_getWindow);

var _resetScrolling = require('../util/reset-scrolling');

var _resetScrolling2 = _interopRequireDefault(_resetScrolling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function focus(element) {
  if (element.focus) {
    element.focus();
    return (0, _activeElement2.default)(element) ? element : null;
  }

  var _window = (0, _getWindow2.default)(element);

  try {
    // The element itself does not have a focus method.
    // This is true for SVG elements in Firefox and IE,
    // as well as MathML elements in every browser.
    // IE9 - 11 will let us abuse HTMLElement's focus method,
    // Firefox and Edge will throw an error.
    _window.HTMLElement.prototype.focus.call(element);
    return (0, _activeElement2.default)(element) ? element : null;
  } catch (e) {
    var actionPerformed = (0, _focus2.default)(element);
    return actionPerformed && (0, _activeElement2.default)(element) ? element : null;
  }
}
// wrapper for HTMLElement.prototype.focus

var except = {
  // exclude elements affected by the IE flexbox bug
  flexbox: true,
  // exclude overflowing elements that are not intentionally
  // made focusable by adding a tabindex attribute
  scrollable: true,
  // include elements that don't have a focus() method
  onlyTabbable: true
};

module.exports = exports['default'];
//# sourceMappingURL=focus.js.map