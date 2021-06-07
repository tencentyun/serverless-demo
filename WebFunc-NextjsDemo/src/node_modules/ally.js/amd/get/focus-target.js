(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './focus-redirect-target', '../get/parents', '../is/focusable', '../util/context-to-element'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./focus-redirect-target'), require('../get/parents'), require('../is/focusable'), require('../util/context-to-element'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.focusRedirectTarget, global.parents, global.focusable, global.contextToElement);
    global.focusTarget = mod.exports;
  }
})(this, function (module, exports, _focusRedirectTarget, _parents, _focusable, _contextToElement) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        except = _ref.except;

    var element = (0, _contextToElement2.default)({
      label: 'get/focus-target',
      context: context
    });

    var result = null;
    var getTarget = function getTarget(_element) {
      var focusable = _focusable2.default.rules({
        context: _element,
        except: except
      });

      if (focusable) {
        result = _element;
        return true;
      }

      result = (0, _focusRedirectTarget2.default)({
        context: _element,
        skipFocusable: true
      });

      return Boolean(result);
    };

    if (getTarget(element)) {
      return result;
    }

    (0, _parents2.default)({ context: element }).slice(1).some(getTarget);
    return result;
  };

  var _focusRedirectTarget2 = _interopRequireDefault(_focusRedirectTarget);

  var _parents2 = _interopRequireDefault(_parents);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=focus-target.js.map