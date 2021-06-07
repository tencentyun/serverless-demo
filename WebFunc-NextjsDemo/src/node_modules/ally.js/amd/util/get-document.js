(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["module", "exports"], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports);
    global.getDocument = mod.exports;
  }
})(this, function (module, exports) {
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
});
//# sourceMappingURL=get-document.js.map