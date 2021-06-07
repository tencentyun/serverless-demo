"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (elements) {
  return elements.sort(compareDomPosition);
};

// sorts a list of elements according to their order in the DOM

function compareDomPosition(a, b) {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

module.exports = exports["default"];
//# sourceMappingURL=sort-dom-order.js.map