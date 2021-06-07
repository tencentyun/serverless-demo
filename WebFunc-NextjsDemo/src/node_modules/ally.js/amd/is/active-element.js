(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', '../get/shadow-host', '../util/get-document'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('../get/shadow-host'), require('../util/get-document'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.shadowHost, global.getDocument);
    global.activeElement = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _shadowHost, _getDocument) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context) {
    var element = (0, _contextToElement2.default)({
      label: 'is/active-element',
      resolveDocument: true,
      context: context
    });

    var _document = (0, _getDocument2.default)(element);
    if (_document.activeElement === element) {
      return true;
    }

    var shadowHost = (0, _shadowHost2.default)({ context: element });
    if (shadowHost && shadowHost.shadowRoot.activeElement === element) {
      return true;
    }

    return false;
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _shadowHost2 = _interopRequireDefault(_shadowHost);

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=active-element.js.map