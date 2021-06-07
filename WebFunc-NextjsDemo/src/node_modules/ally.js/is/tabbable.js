'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _visible = require('./visible');

var _visible2 = _interopRequireDefault(_visible);

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _elementMatches = require('../util/element-matches');

var _elementMatches2 = _interopRequireDefault(_elementMatches);

var _tabindexValue = require('../util/tabindex-value');

var _tabindexValue2 = _interopRequireDefault(_tabindexValue);

var _focusRelevant = require('./focus-relevant');

var _focusRelevant2 = _interopRequireDefault(_focusRelevant);

var _getFrameElement = require('../util/get-frame-element');

var _getFrameElement2 = _interopRequireDefault(_getFrameElement);

var _platform = require('../util/platform');

var _platform2 = _interopRequireDefault(_platform);

var _imageMap = require('../util/image-map');

var _is = require('./is.util');

var _supports2 = require('../supports/supports');

var _supports3 = _interopRequireDefault(_supports2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// determine if an element can be focused by keyboard (i.e. is part of the document's sequential focus navigation order)

var supports = void 0;

// Internet Explorer 11 considers fieldset, table, td focusable, but not tabbable
// Internet Explorer 11 considers body to have [tabindex=0], but does not allow tabbing to it
var focusableElementsPattern = /^(fieldset|table|td|body)$/;

function isTabbableRules() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      _ref$except = _ref.except,
      except = _ref$except === undefined ? {
    flexbox: false,
    scrollable: false,
    shadow: false,
    visible: false,
    onlyTabbable: false
  } : _ref$except;

  if (!supports) {
    supports = (0, _supports3.default)();
  }

  var element = (0, _contextToElement2.default)({
    label: 'is/tabbable',
    resolveDocument: true,
    context: context
  });

  if (_platform2.default.is.BLINK && _platform2.default.is.ANDROID && _platform2.default.majorVersion > 42) {
    // External keyboard support worked fine in CHrome 42, but stopped working in Chrome 45.
    // The on-screen keyboard does not provide a way to focus the next input element (like iOS does).
    // That leaves us with no option to advance focus by keyboard, ergo nothing is tabbable (keyboard focusable).
    return false;
  }

  var frameElement = (0, _getFrameElement2.default)(element);
  if (frameElement) {
    if (_platform2.default.is.WEBKIT && _platform2.default.is.IOS) {
      // iOS only does not consider anything from another browsing context keyboard focusable
      return false;
    }

    // iframe[tabindex="-1"] and object[tabindex="-1"] inherit the
    // tabbable demotion onto elements of their browsing contexts
    if ((0, _tabindexValue2.default)(frameElement) < 0) {
      return false;
    }

    if (!except.visible && (_platform2.default.is.BLINK || _platform2.default.is.WEBKIT) && !(0, _visible2.default)(frameElement)) {
      // Blink and WebKit consider elements in hidden browsing contexts focusable, but not tabbable
      return false;
    }

    // Webkit and Blink don't consider anything in <object> tabbable
    // Blink fixed that fixed in Chrome 54, Opera 41
    var frameNodeName = frameElement.nodeName.toLowerCase();
    if (frameNodeName === 'object') {
      var isFixedBlink = _platform2.default.name === 'Chrome' && _platform2.default.majorVersion >= 54 || _platform2.default.name === 'Opera' && _platform2.default.majorVersion >= 41;

      if (_platform2.default.is.WEBKIT || _platform2.default.is.BLINK && !isFixedBlink) {
        return false;
      }
    }
  }

  var nodeName = element.nodeName.toLowerCase();
  var _tabindex = (0, _tabindexValue2.default)(element);
  var tabindex = _tabindex === null ? null : _tabindex >= 0;

  if (_platform2.default.is.EDGE && _platform2.default.majorVersion >= 14 && frameElement && element.ownerSVGElement && _tabindex < 0) {
    // Edge 14+ considers <a xlink:href="…" tabindex="-1"> keyboard focusable
    // if the element is in a nested browsing context
    return true;
  }

  var hasTabbableTabindexOrNone = tabindex !== false;
  var hasTabbableTabindex = _tabindex !== null && _tabindex >= 0;

  // NOTE: Firefox 31 considers [contenteditable] to have [tabindex=-1], but allows tabbing to it
  // fixed in Firefox 40 the latest - https://bugzilla.mozilla.org/show_bug.cgi?id=1185657
  if (element.hasAttribute('contenteditable')) {
    // tabbing can still be disabled by explicitly providing [tabindex="-1"]
    return hasTabbableTabindexOrNone;
  }

  if (focusableElementsPattern.test(nodeName) && tabindex !== true) {
    return false;
  }

  if (_platform2.default.is.WEBKIT && _platform2.default.is.IOS) {
    // iOS only considers a hand full of elements tabbable (keyboard focusable)
    // this holds true even with external keyboards
    var potentiallyTabbable = nodeName === 'input' && element.type === 'text' || element.type === 'password' || nodeName === 'select' || nodeName === 'textarea' || element.hasAttribute('contenteditable');

    if (!potentiallyTabbable) {
      var style = window.getComputedStyle(element, null);
      potentiallyTabbable = (0, _is.isUserModifyWritable)(style);
    }

    if (!potentiallyTabbable) {
      return false;
    }
  }

  if (nodeName === 'use' && _tabindex !== null) {
    if (_platform2.default.is.BLINK || _platform2.default.is.WEBKIT && _platform2.default.majorVersion === 9) {
      // In Chrome and Safari 9 the <use> element is keyboard focusable even for tabindex="-1"
      return true;
    }
  }

  if ((0, _elementMatches2.default)(element, 'svg a') && element.hasAttribute('xlink:href')) {
    if (hasTabbableTabindexOrNone) {
      // in Trident and Gecko SVGElement does not handle the tabIndex property properly
      return true;
    }

    if (element.focus && !supports.focusSvgNegativeTabindexAttribute) {
      // Firefox 51 and 52 treat any natively tabbable SVG element with
      // tabindex="-1" as tabbable and everything else as inert
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=1302340
      return true;
    }
  }

  if (nodeName === 'svg' && supports.focusSvgInIframe && hasTabbableTabindexOrNone) {
    return true;
  }

  if (_platform2.default.is.TRIDENT || _platform2.default.is.EDGE) {
    if (nodeName === 'svg') {
      if (supports.focusSvg) {
        // older Internet Explorers consider <svg> keyboard focusable
        // unless they have focsable="false", but then they wouldn't
        // be focusable and thus not even reach this filter
        return true;
      }

      // elements that have [focusable] are automatically keyboard focusable regardless of the attribute's value
      return element.hasAttribute('focusable') || hasTabbableTabindex;
    }

    if (element.ownerSVGElement) {
      if (supports.focusSvgTabindexAttribute && hasTabbableTabindex) {
        return true;
      }

      // elements that have [focusable] are automatically keyboard focusable regardless of the attribute's value
      return element.hasAttribute('focusable');
    }
  }
  if (element.tabIndex === undefined) {
    return Boolean(except.onlyTabbable);
  }

  if (nodeName === 'audio') {
    if (!element.hasAttribute('controls')) {
      // In Internet Explorer the <audio> element is focusable, but not tabbable, and tabIndex property is wrong
      return false;
    } else if (_platform2.default.is.BLINK) {
      // In Chrome <audio controls tabindex="-1"> remains keyboard focusable
      return true;
    }
  }

  if (nodeName === 'video') {
    if (!element.hasAttribute('controls')) {
      if (_platform2.default.is.TRIDENT || _platform2.default.is.EDGE) {
        // In Internet Explorer and Edge the <video> element is focusable, but not tabbable, and tabIndex property is wrong
        return false;
      }
    } else if (_platform2.default.is.BLINK || _platform2.default.is.GECKO) {
      // In Chrome and Firefox <video controls tabindex="-1"> remains keyboard focusable
      return true;
    }
  }

  if (nodeName === 'object') {
    if (_platform2.default.is.BLINK || _platform2.default.is.WEBKIT) {
      // In all Blink and WebKit based browsers <embed> and <object> are never keyboard focusable, even with tabindex="0" set
      return false;
    }
  }

  if (nodeName === 'iframe') {
    // In Internet Explorer all iframes are only focusable
    // In WebKit, Blink and Gecko iframes may be tabbable depending on content.
    // Since we can't reliably investigate iframe documents because of the
    // SameOriginPolicy, we're declaring everything only focusable.
    return false;
  }

  if (!except.scrollable && _platform2.default.is.GECKO) {
    // Firefox considers scrollable containers keyboard focusable,
    // even though their tabIndex property is -1
    var _style = window.getComputedStyle(element, null);
    if ((0, _is.hasCssOverflowScroll)(_style)) {
      return hasTabbableTabindexOrNone;
    }
  }

  if (_platform2.default.is.TRIDENT || _platform2.default.is.EDGE) {
    // IE and Edge degrade <area> to script focusable, if the image
    // using the <map> has been given tabindex="-1"
    if (nodeName === 'area') {
      var img = (0, _imageMap.getImageOfArea)(element);
      if (img && (0, _tabindexValue2.default)(img) < 0) {
        return false;
      }
    }

    var _style2 = window.getComputedStyle(element, null);
    if ((0, _is.isUserModifyWritable)(_style2)) {
      // prevent being swallowed by the overzealous isScrollableContainer() below
      return element.tabIndex >= 0;
    }

    if (!except.flexbox && (0, _is.hasCssDisplayFlex)(_style2)) {
      if (_tabindex !== null) {
        return hasTabbableTabindex;
      }

      return isFocusRelevantWithoutFlexbox(element) && isTabbableWithoutFlexbox(element);
    }

    // IE considers scrollable containers script focusable only,
    // even though their tabIndex property is 0
    if ((0, _is.isScrollableContainer)(element, nodeName)) {
      return false;
    }

    var parent = element.parentElement;
    if (parent) {
      var parentNodeName = parent.nodeName.toLowerCase();
      var parentStyle = window.getComputedStyle(parent, null);
      // IE considers scrollable bodies script focusable only,
      if ((0, _is.isScrollableContainer)(parent, nodeName, parentNodeName, parentStyle)) {
        return false;
      }

      // Children of focusable elements with display:flex are focusable in IE10-11,
      // even though their tabIndex property suggests otherwise
      if ((0, _is.hasCssDisplayFlex)(parentStyle)) {
        // value of tabindex takes precedence
        return hasTabbableTabindex;
      }
    }
  }

  // https://www.w3.org/WAI/PF/aria-practices/#focus_tabindex
  return element.tabIndex >= 0;
}

// bind exceptions to an iterator callback
isTabbableRules.except = function () {
  var except = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var isTabbable = function isTabbable(context) {
    return isTabbableRules({
      context: context,
      except: except
    });
  };

  isTabbable.rules = isTabbableRules;
  return isTabbable;
};

var isFocusRelevantWithoutFlexbox = _focusRelevant2.default.rules.except({ flexbox: true });
var isTabbableWithoutFlexbox = isTabbableRules.except({ flexbox: true });

// provide isTabbable(context) as default iterator callback
var isTabbable = isTabbableRules.except({});
exports.default = isTabbable;
module.exports = exports['default'];
//# sourceMappingURL=tabbable.js.map