(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../get/parents'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../get/parents'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.parents);
    global.resetScrolling = mod.exports;
  }
})(this, function (module, exports, _parents) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = collectScrollPositions;

  var _parents2 = _interopRequireDefault(_parents);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function collectScrollPositions(element) {
    var parents = (0, _parents2.default)({ context: element });
    var list = parents.slice(1).map(function (element) {
      return {
        element: element,
        scrollTop: element.scrollTop,
        scrollLeft: element.scrollLeft
      };
    });

    return function resetScrollPositions() {
      list.forEach(function (entry) {
        entry.element.scrollTop = entry.scrollTop;
        entry.element.scrollLeft = entry.scrollLeft;
      });
    };
  }
  module.exports = exports['default'];
});
//# sourceMappingURL=reset-scrolling.js.map