(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../is/visible', '../util/visible-area', '../util/context-to-element', '../prototype/window.requestanimationframe'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../is/visible'), require('../util/visible-area'), require('../util/context-to-element'), require('../prototype/window.requestanimationframe'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.visible, global.visibleArea, global.contextToElement, global.window);
    global.visibleArea = mod.exports;
  }
})(this, function (module, exports, _visible, _visibleArea, _contextToElement) {
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
      throw new TypeError('when/visible-area requires options.callback to be a function');
    }

    if (typeof area !== 'number') {
      area = 1;
    }

    var element = (0, _contextToElement2.default)({
      label: 'when/visible-area',
      context: context
    });

    var raf = void 0;
    var evaluate = null;
    var disengage = function disengage() {
      raf && cancelAnimationFrame(raf);
    };

    var predicate = function predicate() {
      return !(0, _visible2.default)(element) || (0, _visibleArea2.default)(element) < area || callback(element) === false;
    };

    var checkPredicate = function checkPredicate() {
      if (predicate()) {
        evaluate();
        return;
      }

      disengage();
    };

    evaluate = function evaluate() {
      raf = requestAnimationFrame(checkPredicate);
    };

    evaluate();
    return { disengage: disengage };
  };

  var _visible2 = _interopRequireDefault(_visible);

  var _visibleArea2 = _interopRequireDefault(_visibleArea);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=visible-area.js.map