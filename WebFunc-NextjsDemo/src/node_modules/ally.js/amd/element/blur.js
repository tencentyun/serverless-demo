(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../is/active-element', '../util/context-to-element', '../util/get-window'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../is/active-element'), require('../util/context-to-element'), require('../util/get-window'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.activeElement, global.contextToElement, global.getWindow);
    global.blur = mod.exports;
  }
})(this, function (module, exports, _activeElement, _contextToElement, _getWindow) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context) {
    var element = (0, _contextToElement2.default)({
      label: 'element/blur',
      context: context
    });

    if (!(0, _activeElement2.default)(element)) {
      return null;
    }

    var nodeName = element.nodeName.toLowerCase();
    if (nodeName === 'body') {
      // prevent the browser window from losing focus in IE9
      // according to https://bugs.jqueryui.com/ticket/9420
      return null;
    }

    if (element.blur) {
      element.blur();
      return document.activeElement;
    }

    var _window = (0, _getWindow2.default)(element);

    try {
      // The element itself does not have a blur method.
      // This is true for SVG elements in Firefox and IE,
      // as well as MathML elements in every browser.
      // IE9 - 11 will let us abuse HTMLElement's blur method,
      // Firefox and Edge will throw an error.
      _window.HTMLElement.prototype.blur.call(element);
    } catch (e) {
      // if we're not in an HTML document, we don't have access to document.body
      var body = _window.document && _window.document.body;
      if (!body) {
        return null;
      }

      // we can't simply call document.body.focus() unless
      // we make sure the element actually is focusable
      var tabindex = body.getAttribute('tabindex');
      body.setAttribute('tabindex', '-1');
      body.focus();
      if (tabindex) {
        body.setAttribute('tabindex', tabindex);
      } else {
        body.removeAttribute('tabindex');
      }
    }

    return _window.document.activeElement;
  };

  var _activeElement2 = _interopRequireDefault(_activeElement);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _getWindow2 = _interopRequireDefault(_getWindow);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=blur.js.map