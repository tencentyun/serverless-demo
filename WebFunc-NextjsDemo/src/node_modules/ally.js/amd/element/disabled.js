(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', '../util/tabindex-value', '../is/native-disabled-supported', '../util/toggle-attribute', '../util/toggle-attribute-value', '../util/logger', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('../util/tabindex-value'), require('../is/native-disabled-supported'), require('../util/toggle-attribute'), require('../util/toggle-attribute-value'), require('../util/logger'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.tabindexValue, global.nativeDisabledSupported, global.toggleAttribute, global.toggleAttributeValue, global.logger, global.supports);
    global.disabled = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _tabindexValue, _nativeDisabledSupported, _toggleAttribute, _toggleAttributeValue, _logger, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context, disabledState) {
    if (!supports) {
      supports = (0, _supports3.default)();
    }

    var element = (0, _contextToElement2.default)({
      label: 'element/disabled',
      context: context
    });

    // accept truthy/falsy values
    disabledState = Boolean(disabledState);
    var currentState = element.hasAttribute('data-ally-disabled');
    // if there's no value to set, we're running as a getter
    var runningAsGetter = arguments.length === 1;

    if ((0, _nativeDisabledSupported2.default)(element)) {
      if (runningAsGetter) {
        return element.disabled;
      }

      // form elements know the disabled attribute, which we shall use instead of our poor man's copy of it
      element.disabled = disabledState;
      return element;
    }

    if (runningAsGetter) {
      return currentState;
    }

    if (currentState === disabledState) {
      // no update necessary
      return element;
    }

    setElementDisabled(element, disabledState);
    return element;
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _tabindexValue2 = _interopRequireDefault(_tabindexValue);

  var _nativeDisabledSupported2 = _interopRequireDefault(_nativeDisabledSupported);

  var _toggleAttribute2 = _interopRequireDefault(_toggleAttribute);

  var _toggleAttributeValue2 = _interopRequireDefault(_toggleAttributeValue);

  var _logger2 = _interopRequireDefault(_logger);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var supports = void 0;
  /*
    Utility to make any element inert (disabled). Inert means the elements cannot be interacted
    with and they cannot be focused via script, pointer or keyboard - and thus not receive focus.
  
    Elements made inert (disabled) by this utility are given the attribute [data-ally-disabled="true"].
  
    ---------------
  
    inert attribute was [removed](https://html5.org/r/8536) [tweet by steve](https://twitter.com/stevefaulkner/status/443075900201259008)
    but definition of [inert subtrees](https://www.w3.org/html/wg/drafts/html/master/editing.html#inert-subtrees) remains.
  
    [implementation idea by Vasilis](https://codepen.io/vasilisvg/pen/scowI)
    [inert attribute polyfill by GoogleChrome](https://github.com/GoogleChrome/inert-polyfill)
  
    [Gecko Bug: Inert Attribute](https://bugzilla.mozilla.org/show_bug.cgi?id=921504)
    [Chromium Bug: Inert Attribute](https://code.google.com/p/chromium/issues/detail?id=269846)
    [Chromium Bug: Inert Subtree](https://code.google.com/p/chromium/issues/detail?id=241699)
    [WebKit Bug: Inert Subtree](https://bugs.webkit.org/show_bug.cgi?id=110952)
  */

  function disabledFocus() {
    _logger2.default.warn('trying to focus inert element', this);
  }

  function disableTabindex(element, disabledState) {
    if (disabledState) {
      var tabIndex = (0, _tabindexValue2.default)(element);
      (0, _toggleAttributeValue2.default)({
        element: element,
        attribute: 'tabindex',
        temporaryValue: '-1',
        saveValue: tabIndex !== null ? tabIndex : ''
      });
    } else {
      (0, _toggleAttributeValue2.default)({
        element: element,
        attribute: 'tabindex'
      });
    }
  }

  function disableVideoControls(element, disabledState) {
    (0, _toggleAttribute2.default)({
      element: element,
      attribute: 'controls',
      remove: disabledState
    });
  }

  function disableSvgFocusable(element, disabledState) {
    (0, _toggleAttributeValue2.default)({
      element: element,
      attribute: 'focusable',
      temporaryValue: disabledState ? 'false' : undefined
    });
  }

  function disableSvgLink(element, disabledState) {
    (0, _toggleAttribute2.default)({
      element: element,
      attribute: 'xlink:href',
      remove: disabledState
    });
  }

  function setAriaDisabled(element, disabledState) {
    (0, _toggleAttributeValue2.default)({
      element: element,
      attribute: 'aria-disabled',
      temporaryValue: disabledState ? 'true' : undefined
    });
  }

  function disableScriptFocus(element, disabledState) {
    if (disabledState) {
      // make sure no script can focus the element
      element.focus = disabledFocus;
    } else {
      // restore original focus function from prototype
      delete element.focus;
    }
  }

  function disablePointerEvents(element, disabledState) {
    if (disabledState) {
      // remember previous pointer events status so we can restore it
      var pointerEvents = element.style.pointerEvents || '';
      element.setAttribute('data-inert-pointer-events', pointerEvents);
      // make sure no pointer interaction can access the element
      element.style.pointerEvents = 'none';
    } else {
      // restore to previous pointer interaction status
      var _pointerEvents = element.getAttribute('data-inert-pointer-events');
      element.removeAttribute('data-inert-pointer-events');
      element.style.pointerEvents = _pointerEvents;
    }
  }

  function setElementDisabled(element, disabledState) {
    setAriaDisabled(element, disabledState);
    disableTabindex(element, disabledState);
    disableScriptFocus(element, disabledState);
    disablePointerEvents(element, disabledState);

    var nodeName = element.nodeName.toLowerCase();
    if (nodeName === 'video' || nodeName === 'audio') {
      // Blink and Gecko leave <video controls tabindex="-1"> in document focus navigation sequence
      // Blink leaves <audio controls tabindex="-1"> in document focus navigation sequence
      disableVideoControls(element, disabledState);
    }

    if (nodeName === 'svg' || element.ownerSVGElement) {
      if (supports.focusSvgFocusableAttribute) {
        // Internet Explorer knows focusable="false" instead of tabindex="-1"
        disableSvgFocusable(element, disabledState);
      } else if (!supports.focusSvgTabindexAttribute && nodeName === 'a') {
        // Firefox neither knows focusable="false" nor tabindex="-1"
        disableSvgLink(element, disabledState);
      }
    }

    if (disabledState) {
      element.setAttribute('data-ally-disabled', 'true');
    } else {
      element.removeAttribute('data-ally-disabled');
    }
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=disabled.js.map