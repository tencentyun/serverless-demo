(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../is/focusable', '../query/focusable', '../query/tabbable', '../util/context-to-element', '../util/get-document', '../util/merge-dom-order', '../util/image-map', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../is/focusable'), require('../query/focusable'), require('../query/tabbable'), require('../util/context-to-element'), require('../util/get-document'), require('../util/merge-dom-order'), require('../util/image-map'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusable, global.focusable, global.tabbable, global.contextToElement, global.getDocument, global.mergeDomOrder, global.imageMap, global.supports);
    global.focusRedirectTarget = mod.exports;
  }
})(this, function (module, exports, _focusable, _focusable3, _tabbable, _contextToElement, _getDocument, _mergeDomOrder, _imageMap, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        skipFocusable = _ref.skipFocusable;

    if (!supports) {
      supports = (0, _supports3.default)();
    }

    var element = (0, _contextToElement2.default)({
      label: 'get/focus-redirect-target',
      context: context
    });

    if (!skipFocusable && (0, _focusable2.default)(element)) {
      return null;
    }

    var nodeName = element.nodeName.toLowerCase();
    var _document = (0, _getDocument2.default)(element);

    if (nodeName === 'label') {
      return resolveLabelElement(element, _document);
    }

    if (nodeName === 'legend') {
      return resolveLegendElement(element, _document);
    }

    if (nodeName === 'img') {
      return resolveImgElement(element, _document);
    }

    return null;
  };

  var _focusable2 = _interopRequireDefault(_focusable);

  var _focusable4 = _interopRequireDefault(_focusable3);

  var _tabbable2 = _interopRequireDefault(_tabbable);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _getDocument2 = _interopRequireDefault(_getDocument);

  var _mergeDomOrder2 = _interopRequireDefault(_mergeDomOrder);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var supports = void 0;

  function formControlElement(element) {
    var nodeName = element.nodeName.toLowerCase();
    return nodeName === 'input' || nodeName === 'textarea' || nodeName === 'select' || nodeName === 'button';
  }

  function resolveLabelElement(element, _document) {
    var forId = element.getAttribute('for');
    if (forId) {
      // <label for="…"> - referenced form control
      return _document.getElementById(forId);
    }

    // <label><input - nested form control
    return element.querySelector('input, select, textarea');
  }

  function resolveLegendWithinFieldset(element) {
    // Chrome: first focusable input/select/textarea/button within <fieldset>
    var fieldset = element.parentNode;
    var focusable = (0, _focusable4.default)({
      context: fieldset,
      strategy: 'strict'
    });

    return focusable.filter(formControlElement)[0] || null;
  }

  function resolveLegendWithinDocument(element, _document) {
    // Firefox: *next* tabbable (in DOM order)
    var tabbable = (0, _tabbable2.default)({
      // Firefox apparently needs to query from the body element,
      // not the document, looking inside a dynamically written iframe
      context: _document.body,
      strategy: 'strict'
    });

    if (!tabbable.length) {
      return null;
    }

    // sort <legend> into the list of tabbable elements
    // so that we can identify the next element
    var merged = (0, _mergeDomOrder2.default)({
      list: tabbable,
      elements: [element]
    });

    var offset = merged.indexOf(element);
    if (offset === merged.length - 1) {
      return null;
    }

    return merged[offset + 1];
  }

  function resolveLegendElement(element, _document) {
    // <legend> - first <input> in <fieldset>
    if (!supports.focusRedirectLegend) {
      return null;
    }

    // legend must be the first child of a <fieldset>
    var fieldset = element.parentNode;
    if (fieldset.nodeName.toLowerCase() !== 'fieldset') {
      return null;
    }

    if (supports.focusRedirectLegend === 'tabbable') {
      // Firefox goes for *next* tabbable (in DOM order)
      return resolveLegendWithinDocument(element, _document);
    }

    // Chrome goes for first focusable input/select/textarea/button within <fieldset>
    return resolveLegendWithinFieldset(element, _document);
  }

  function resolveImgElement(element) {
    if (!supports.focusRedirectImgUsemap) {
      return null;
    }

    // IE9-11: <img usemap="#…" src="…"> - first <area>
    var map = (0, _imageMap.getMapOfImage)(element);
    return map && map.querySelector('area') || null;
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=focus-redirect-target.js.map