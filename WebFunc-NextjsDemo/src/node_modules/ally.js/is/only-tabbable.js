'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _visible = require('./visible');

var _visible2 = _interopRequireDefault(_visible);

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _getFrameElement = require('../util/get-frame-element');

var _getFrameElement2 = _interopRequireDefault(_getFrameElement);

var _tabindexValue = require('../util/tabindex-value');

var _tabindexValue2 = _interopRequireDefault(_tabindexValue);

var _platform = require('../util/platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isOnlyTabbableRules() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      _ref$except = _ref.except,
      except = _ref$except === undefined ? {
    onlyFocusableBrowsingContext: false,
    visible: false
  } : _ref$except;

  var element = (0, _contextToElement2.default)({
    label: 'is/only-tabbable',
    resolveDocument: true,
    context: context
  });

  if (!except.visible && !(0, _visible2.default)(element)) {
    return false;
  }

  if (!except.onlyFocusableBrowsingContext && (_platform2.default.is.GECKO || _platform2.default.is.TRIDENT || _platform2.default.is.EDGE)) {
    var frameElement = (0, _getFrameElement2.default)(element);
    if (frameElement) {
      if ((0, _tabindexValue2.default)(frameElement) < 0) {
        // iframe[tabindex="-1"] and object[tabindex="-1"] inherit the
        // tabbable demotion onto elements of their browsing contexts
        return false;
      }
    }
  }

  var nodeName = element.nodeName.toLowerCase();
  var tabindex = (0, _tabindexValue2.default)(element);

  if (nodeName === 'label' && _platform2.default.is.GECKO) {
    // Firefox cannot focus, but tab to: label[tabindex=0]
    return tabindex !== null && tabindex >= 0;
  }

  // SVG Elements were keyboard focusable but not script focusable before Firefox 51.
  // Firefox 51 added the focus management DOM API (.focus and .blur) to SVGElement,
  // see https://bugzilla.mozilla.org/show_bug.cgi?id=778654
  if (_platform2.default.is.GECKO && element.ownerSVGElement && !element.focus) {
    if (nodeName === 'a' && element.hasAttribute('xlink:href')) {
      // any focusable child of <svg> cannot be focused, but tabbed to
      if (_platform2.default.is.GECKO) {
        return true;
      }
    }
  }

  return false;
}

// bind exceptions to an iterator callback
isOnlyTabbableRules.except = function () {
  var except = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var isOnlyTabbable = function isOnlyTabbable(context) {
    return isOnlyTabbableRules({
      context: context,
      except: except
    });
  };

  isOnlyTabbable.rules = isOnlyTabbableRules;
  return isOnlyTabbable;
};

// provide isOnlyTabbable(context) as default iterator callback
var isOnlyTabbable = isOnlyTabbableRules.except({});
exports.default = isOnlyTabbable;
module.exports = exports['default'];
//# sourceMappingURL=only-tabbable.js.map