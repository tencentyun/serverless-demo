(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports);
    global.isUtil = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.isUserModifyWritable = isUserModifyWritable;
  exports.hasCssOverflowScroll = hasCssOverflowScroll;
  exports.hasCssDisplayFlex = hasCssDisplayFlex;
  exports.isScrollableContainer = isScrollableContainer;

  // this is a shared utility file for focus-relevant.js and tabbable.js
  // separate testing of this file's functions is not necessary,
  // as they're implicitly tested by way of the consumers

  function isUserModifyWritable(style) {
    // https://www.w3.org/TR/1999/WD-css3-userint-19990916#user-modify
    // https://github.com/medialize/ally.js/issues/17
    var userModify = style.webkitUserModify || '';
    return Boolean(userModify && userModify.indexOf('write') !== -1);
  }

  function hasCssOverflowScroll(style) {
    return [style.getPropertyValue('overflow'), style.getPropertyValue('overflow-x'), style.getPropertyValue('overflow-y')].some(function (overflow) {
      return overflow === 'auto' || overflow === 'scroll';
    });
  }

  function hasCssDisplayFlex(style) {
    return style.display.indexOf('flex') > -1;
  }

  function isScrollableContainer(element, nodeName, parentNodeName, parentStyle) {
    if (nodeName !== 'div' && nodeName !== 'span') {
      // Internet Explorer advances scrollable containers and bodies to focusable
      // only if the scrollable container is <div> or <span> - this does *not*
      // happen for <section>, <article>, …
      return false;
    }

    if (parentNodeName && parentNodeName !== 'div' && parentNodeName !== 'span' && !hasCssOverflowScroll(parentStyle)) {
      return false;
    }

    return element.offsetHeight < element.scrollHeight || element.offsetWidth < element.scrollWidth;
  }
});
//# sourceMappingURL=is.util.js.map