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
    global.comparePosition = mod.exports;
  }
})(this, function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.getParentComparator = getParentComparator;

  // Node.compareDocumentPosition is available since IE9
  // see https://developer.mozilla.org/en-US/docs/Web/API/Node.compareDocumentPosition

  // callback returns true when element is contained by parent or is the parent suited for use with Array.some()
  /*
    USAGE:
      var isChildOf = getParentComparator({parent: someNode});
      listOfElements.some(isChildOf)
  */

  function getParentComparator() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        parent = _ref.parent,
        element = _ref.element,
        includeSelf = _ref.includeSelf;

    if (parent) {
      return function isChildOf(node) {
        return Boolean(includeSelf && node === parent || parent.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_CONTAINED_BY);
      };
    } else if (element) {
      return function isParentOf(node) {
        return Boolean(includeSelf && element === node || node.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_CONTAINED_BY);
      };
    }

    throw new TypeError('util/compare-position#getParentComparator required either options.parent or options.element');
  }
});
//# sourceMappingURL=compare-position.js.map