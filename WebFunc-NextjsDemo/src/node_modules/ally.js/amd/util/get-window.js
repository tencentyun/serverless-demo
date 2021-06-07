(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './get-document'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./get-document'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.getDocument);
    global.getWindow = mod.exports;
  }
})(this, function (module, exports, _getDocument) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (node) {
    var _document = (0, _getDocument2.default)(node);
    return _document.defaultView || window;
  };

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=get-window.js.map