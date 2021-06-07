'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _focusRelevant = require('./focus-relevant');

var _focusRelevant2 = _interopRequireDefault(_focusRelevant);

var _validArea = require('./valid-area');

var _validArea2 = _interopRequireDefault(_validArea);

var _visible = require('./visible');

var _visible2 = _interopRequireDefault(_visible);

var _disabled = require('./disabled');

var _disabled2 = _interopRequireDefault(_disabled);

var _onlyTabbable = require('./only-tabbable');

var _onlyTabbable2 = _interopRequireDefault(_onlyTabbable);

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _getFrameElement = require('../util/get-frame-element');

var _getFrameElement2 = _interopRequireDefault(_getFrameElement);

var _tabindexValue = require('../util/tabindex-value');

var _tabindexValue2 = _interopRequireDefault(_tabindexValue);

var _supports2 = require('../supports/supports');

var _supports3 = _interopRequireDefault(_supports2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var supports = void 0;
// determine if an element can be focused

// https://www.w3.org/TR/html5/editing.html#focus-management

// NOTE: The following known issues exist:
//   Gecko: `svg a[xlink|href]` is not identified as focusable (because SVGElement.prototype.focus is missing)
//   Blink, WebKit: SVGElements that have been made focusable by adding a focus event listener are not identified as focusable

function isOnlyFocusRelevant(element) {
  var nodeName = element.nodeName.toLowerCase();
  if (nodeName === 'embed' || nodeName === 'keygen') {
    // embed is considered focus-relevant but not focusable
    // see https://github.com/medialize/ally.js/issues/82
    return true;
  }

  var _tabindex = (0, _tabindexValue2.default)(element);
  if (element.shadowRoot && _tabindex === null) {
    // ShadowDOM host elements *may* receive focus
    // even though they are not considered focuable
    return true;
  }

  if (nodeName === 'label') {
    // <label tabindex="0"> is only tabbable in Firefox, not script-focusable
    // there's no way to make an element focusable other than by adding a tabindex,
    // and focus behavior of the label element seems hard-wired to ignore tabindex
    // in some browsers (like Gecko, Blink and WebKit)
    return !supports.focusLabelTabindex || _tabindex === null;
  }

  if (nodeName === 'legend') {
    return _tabindex === null;
  }

  if (supports.focusSvgFocusableAttribute && (element.ownerSVGElement || nodeName === 'svg')) {
    // Internet Explorer understands the focusable attribute introduced in SVG Tiny 1.2
    var focusableAttribute = element.getAttribute('focusable');
    return focusableAttribute && focusableAttribute === 'false';
  }

  if (nodeName === 'img' && element.hasAttribute('usemap')) {
    // Gecko, Trident and Edge do not allow an image with an image map and tabindex to be focused,
    // it appears the tabindex is overruled so focus is still forwarded to the <map>
    return _tabindex === null || !supports.focusImgUsemapTabindex;
  }

  if (nodeName === 'area') {
    // all <area>s are considered relevant,
    // but only the valid <area>s are focusable
    return !(0, _validArea2.default)(element);
  }

  return false;
}

function isFocusableRules() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      _ref$except = _ref.except,
      except = _ref$except === undefined ? {
    disabled: false,
    visible: false,
    onlyTabbable: false
  } : _ref$except;

  if (!supports) {
    supports = (0, _supports3.default)();
  }

  var _isOnlyTabbable = _onlyTabbable2.default.rules.except({
    onlyFocusableBrowsingContext: true,
    visible: except.visible
  });

  var element = (0, _contextToElement2.default)({
    label: 'is/focusable',
    resolveDocument: true,
    context: context
  });

  var focusRelevant = _focusRelevant2.default.rules({
    context: element,
    except: except
  });

  if (!focusRelevant || isOnlyFocusRelevant(element)) {
    return false;
  }

  if (!except.disabled && (0, _disabled2.default)(element)) {
    return false;
  }

  if (!except.onlyTabbable && _isOnlyTabbable(element)) {
    // some elements may be keyboard focusable, but not script focusable
    return false;
  }

  // elements that are not rendered, cannot be focused
  if (!except.visible) {
    var visibilityOptions = {
      context: element,
      except: {}
    };

    if (supports.focusInHiddenIframe) {
      // WebKit and Blink can focus content in hidden <iframe> and <object>
      visibilityOptions.except.browsingContext = true;
    }

    if (supports.focusObjectSvgHidden) {
      // Blink allows focusing the object element, even if it has visibility: hidden;
      // @browser-issue Blink https://code.google.com/p/chromium/issues/detail?id=586191
      var _nodeName2 = element.nodeName.toLowerCase();
      if (_nodeName2 === 'object') {
        visibilityOptions.except.cssVisibility = true;
      }
    }

    if (!_visible2.default.rules(visibilityOptions)) {
      return false;
    }
  }

  var frameElement = (0, _getFrameElement2.default)(element);
  if (frameElement) {
    var _nodeName = frameElement.nodeName.toLowerCase();
    if (_nodeName === 'object' && !supports.focusInZeroDimensionObject) {
      if (!frameElement.offsetWidth || !frameElement.offsetHeight) {
        // WebKit can not focus content in <object> if it doesn't have dimensions
        return false;
      }
    }
  }

  var nodeName = element.nodeName.toLowerCase();
  if (nodeName === 'svg' && supports.focusSvgInIframe && !frameElement && element.getAttribute('tabindex') === null) {
    return false;
  }

  return true;
}

// bind exceptions to an iterator callback
isFocusableRules.except = function () {
  var except = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var isFocusable = function isFocusable(context) {
    return isFocusableRules({
      context: context,
      except: except
    });
  };

  isFocusable.rules = isFocusableRules;
  return isFocusable;
};

// provide isFocusRelevant(context) as default iterator callback
var isFocusable = isFocusableRules.except({});
exports.default = isFocusable;
module.exports = exports['default'];
//# sourceMappingURL=focusable.js.map