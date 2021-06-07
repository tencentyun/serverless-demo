"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (node) {
  if (!node) {
    return document;
  }

  if (node.nodeType === Node.DOCUMENT_NODE) {
    return node;
  }

  return node.ownerDocument || document;
};

module.exports = exports["default"];
//# sourceMappingURL=get-document.js.map