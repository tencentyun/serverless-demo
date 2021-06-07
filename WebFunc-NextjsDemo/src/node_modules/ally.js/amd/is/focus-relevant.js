(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../get/parents', '../util/context-to-element', '../util/element-matches', '../util/tabindex-value', './valid-tabindex', './is.util', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../get/parents'), require('../util/context-to-element'), require('../util/element-matches'), require('../util/tabindex-value'), require('./valid-tabindex'), require('./is.util'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.parents, global.contextToElement, global.elementMatches, global.tabindexValue, global.validTabindex, global.is, global.supports);
    global.focusRelevant = mod.exports;
  }
})(this, function (module, exports, _parents, _contextToElement, _elementMatches, _tabindexValue, _validTabindex, _is, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _parents2 = _interopRequireDefault(_parents);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _elementMatches2 = _interopRequireDefault(_elementMatches);

  var _tabindexValue2 = _interopRequireDefault(_tabindexValue);

  var _validTabindex2 = _interopRequireDefault(_validTabindex);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var supports = void 0;
  // determine if an element supports.can be focused by script regardless
  // of the element actually being focusable at the time of execution
  // i.e. <input disabled> is conisdered focus-relevant, but not focusable

  function isFocusRelevantRules() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        _ref$except = _ref.except,
        except = _ref$except === undefined ? {
      flexbox: false,
      scrollable: false,
      shadow: false
    } : _ref$except;

    if (!supports) {
      supports = (0, _supports3.default)();
    }

    var element = (0, _contextToElement2.default)({
      label: 'is/focus-relevant',
      resolveDocument: true,
      context: context
    });

    if (!except.shadow && element.shadowRoot) {
      // a ShadowDOM host receives focus when the focus moves to its content
      return true;
    }

    var nodeName = element.nodeName.toLowerCase();

    if (nodeName === 'input' && element.type === 'hidden') {
      // input[type="hidden"] supports.cannot be focused
      return false;
    }

    if (nodeName === 'input' || nodeName === 'select' || nodeName === 'button' || nodeName === 'textarea') {
      return true;
    }

    if (nodeName === 'legend' && supports.focusRedirectLegend) {
      // specifics filtered in is/focusable
      return true;
    }

    if (nodeName === 'label') {
      // specifics filtered in is/focusable
      return true;
    }

    if (nodeName === 'area') {
      // specifics filtered in is/focusable
      return true;
    }

    if (nodeName === 'a' && element.hasAttribute('href')) {
      return true;
    }

    if (nodeName === 'object' && element.hasAttribute('usemap')) {
      // object[usemap] is not focusable in any browser
      return false;
    }

    if (nodeName === 'object') {
      var svgType = element.getAttribute('type');
      if (!supports.focusObjectSvg && svgType === 'image/svg+xml') {
        // object[type="image/svg+xml"] is not focusable in Internet Explorer
        return false;
      } else if (!supports.focusObjectSwf && svgType === 'application/x-shockwave-flash') {
        // object[type="application/x-shockwave-flash"] is not focusable in Internet Explorer 9
        return false;
      }
    }

    if (nodeName === 'iframe' || nodeName === 'object') {
      // browsing context containers
      return true;
    }

    if (nodeName === 'embed' || nodeName === 'keygen') {
      // embed is considered focus-relevant but not focusable
      // see https://github.com/medialize/ally.js/issues/82
      return true;
    }

    if (element.hasAttribute('contenteditable')) {
      // also see CSS property user-modify below
      return true;
    }

    if (nodeName === 'audio' && (supports.focusAudioWithoutControls || element.hasAttribute('controls'))) {
      return true;
    }

    if (nodeName === 'video' && (supports.focusVideoWithoutControls || element.hasAttribute('controls'))) {
      return true;
    }

    if (supports.focusSummary && nodeName === 'summary') {
      return true;
    }

    var validTabindex = (0, _validTabindex2.default)(element);

    if (nodeName === 'img' && element.hasAttribute('usemap')) {
      // Gecko, Trident and Edge do not allow an image with an image map and tabindex to be focused,
      // it appears the tabindex is overruled so focus is still forwarded to the <map>
      return validTabindex && supports.focusImgUsemapTabindex || supports.focusRedirectImgUsemap;
    }

    if (supports.focusTable && (nodeName === 'table' || nodeName === 'td')) {
      // IE10-11 supports.can focus <table> and <td>
      return true;
    }

    if (supports.focusFieldset && nodeName === 'fieldset') {
      // IE10-11 supports.can focus <fieldset>
      return true;
    }

    var isSvgElement = nodeName === 'svg';
    var isSvgContent = element.ownerSVGElement;
    var focusableAttribute = element.getAttribute('focusable');
    var tabindex = (0, _tabindexValue2.default)(element);

    if (nodeName === 'use' && tabindex !== null && !supports.focusSvgUseTabindex) {
      // <use> cannot be made focusable by adding a tabindex attribute anywhere but Blink and WebKit
      return false;
    }

    if (nodeName === 'foreignobject') {
      // <use> can only be made focusable in Blink and WebKit
      return tabindex !== null && supports.focusSvgForeignobjectTabindex;
    }

    if ((0, _elementMatches2.default)(element, 'svg a') && element.hasAttribute('xlink:href')) {
      return true;
    }

    if ((isSvgElement || isSvgContent) && element.focus && !supports.focusSvgNegativeTabindexAttribute && tabindex < 0) {
      // Firefox 51 and 52 treat any natively tabbable SVG element with
      // tabindex="-1" as tabbable and everything else as inert
      // see https://bugzilla.mozilla.org/show_bug.cgi?id=1302340
      return false;
    }

    if (isSvgElement) {
      return validTabindex || supports.focusSvg || supports.focusSvgInIframe
      // Internet Explorer understands the focusable attribute introduced in SVG Tiny 1.2
      || Boolean(supports.focusSvgFocusableAttribute && focusableAttribute && focusableAttribute === 'true');
    }

    if (isSvgContent) {
      if (supports.focusSvgTabindexAttribute && validTabindex) {
        return true;
      }

      if (supports.focusSvgFocusableAttribute) {
        // Internet Explorer understands the focusable attribute introduced in SVG Tiny 1.2
        return focusableAttribute === 'true';
      }
    }

    // https://www.w3.org/TR/html5/editing.html#sequential-focus-navigation-and-the-tabindex-attribute
    if (validTabindex) {
      return true;
    }

    var style = window.getComputedStyle(element, null);
    if ((0, _is.isUserModifyWritable)(style)) {
      return true;
    }

    if (supports.focusImgIsmap && nodeName === 'img' && element.hasAttribute('ismap')) {
      // IE10-11 considers the <img> in <a href><img ismap> focusable
      // https://github.com/medialize/ally.js/issues/20
      var hasLinkParent = (0, _parents2.default)({ context: element }).some(function (parent) {
        return parent.nodeName.toLowerCase() === 'a' && parent.hasAttribute('href');
      });

      if (hasLinkParent) {
        return true;
      }
    }

    // https://github.com/medialize/ally.js/issues/21
    if (!except.scrollable && supports.focusScrollContainer) {
      if (supports.focusScrollContainerWithoutOverflow) {
        // Internet Explorer does will consider the scrollable area focusable
        // if the element is a <div> or a <span> and it is in fact scrollable,
        // regardless of the CSS overflow property
        if ((0, _is.isScrollableContainer)(element, nodeName)) {
          return true;
        }
      } else if ((0, _is.hasCssOverflowScroll)(style)) {
        // Firefox requires proper overflow setting, IE does not necessarily
        // https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
        return true;
      }
    }

    if (!except.flexbox && supports.focusFlexboxContainer && (0, _is.hasCssDisplayFlex)(style)) {
      // elements with display:flex are focusable in IE10-11
      return true;
    }

    var parent = element.parentElement;
    if (!except.scrollable && parent) {
      var parentNodeName = parent.nodeName.toLowerCase();
      var parentStyle = window.getComputedStyle(parent, null);
      if (supports.focusScrollBody && (0, _is.isScrollableContainer)(parent, nodeName, parentNodeName, parentStyle)) {
        // scrollable bodies are focusable Internet Explorer
        // https://github.com/medialize/ally.js/issues/21
        return true;
      }

      // Children of focusable elements with display:flex are focusable in IE10-11
      if (supports.focusChildrenOfFocusableFlexbox) {
        if ((0, _is.hasCssDisplayFlex)(parentStyle)) {
          return true;
        }
      }
    }

    // NOTE: elements marked as inert are not focusable,
    // but that property is not exposed to the DOM
    // https://www.w3.org/TR/html5/editing.html#inert

    return false;
  }

  // bind exceptions to an iterator callback
  isFocusRelevantRules.except = function () {
    var except = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var isFocusRelevant = function isFocusRelevant(context) {
      return isFocusRelevantRules({
        context: context,
        except: except
      });
    };

    isFocusRelevant.rules = isFocusRelevantRules;
    return isFocusRelevant;
  };

  // provide isFocusRelevant(context) as default iterator callback
  var isFocusRelevant = isFocusRelevantRules.except({});
  exports.default = isFocusRelevant;
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-relevant.js.map