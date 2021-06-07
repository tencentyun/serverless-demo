(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './visible-area', '../is/focusable', '../util/context-to-element', '../util/get-document'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./visible-area'), require('../is/focusable'), require('../util/context-to-element'), require('../util/get-document'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.visibleArea, global.focusable, global.contextToElement, global.getDocument);
    global.focusable = mod.exports;
  }
})(this, function (module, exports, _visibleArea, _focusable, _contextToElement, _getDocument) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        callback = _ref.callback,
        area = _ref.area;

    if (typeof callback !== 'function') {
      throw new TypeError('when/focusable requires options.callback to be a function');
    }

    var element = (0, _contextToElement2.default)({
      label: 'when/focusable',
      context: context
    });

    var filterCallback = function filterCallback(target) {
      if (!(0, _focusable2.default)(target)) {
        return false;
      }

      return callback(target);
    };

    var _document = (0, _getDocument2.default)(element);
    var handle = (0, _visibleArea2.default)({ context: element, callback: filterCallback, area: area });
    var disengage = function disengage() {
      _document.removeEventListener('focus', disengage, true);
      handle && handle.disengage();
    };

    _document.addEventListener('focus', disengage, true);

    return { disengage: disengage };
  };

  var _visibleArea2 = _interopRequireDefault(_visibleArea);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=focusable.js.map