(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/get-document'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/get-document'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.getDocument);
    global.activeElement = mod.exports;
  }
})(this, function (module, exports, _getDocument) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context;

    var _document = (0, _getDocument2.default)(context);
    var activeElement = void 0;

    try {
      // IE9 throws an "Unspecified error" accessing document.activeElement from an <iframe>
      // see https://github.com/jquery/jquery-ui/blob/ffcfb85c9818954adda69e73cf9ba76ea07b554c/ui/safe-active-element.js#L15-L21
      activeElement = _document.activeElement;
    } catch (e) {}
    // ignore


    // IE11 may return null instead of an element
    // see https://github.com/jquery/jquery-ui/blob/ffcfb85c9818954adda69e73cf9ba76ea07b554c/ui/safe-active-element.js#L23-L28
    // https://github.com/jquery/jquery-ui/blob/ffcfb85c9818954adda69e73cf9ba76ea07b554c/ui/safe-active-element.js#L30-L35
    if (!activeElement || !activeElement.nodeType) {
      activeElement = _document.body || _document.documentElement;
    }

    return activeElement;
  };

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=active-element.js.map