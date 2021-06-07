(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.supports);
    global.nativeDisabledSupported = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context) {
    if (!supports) {
      supports = (0, _supports3.default)();

      if (supports.focusFieldsetDisabled) {
        delete disabledElements.fieldset;
      }

      if (supports.focusFormDisabled) {
        delete disabledElements.form;
      }

      disabledElementsPattern = new RegExp('^(' + Object.keys(disabledElements).join('|') + ')$');
    }

    var element = (0, _contextToElement2.default)({
      label: 'is/native-disabled-supported',
      context: context
    });

    var nodeName = element.nodeName.toLowerCase();
    return Boolean(disabledElementsPattern.test(nodeName));
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // Determine if an element supports the disabled attribute

  var supports = void 0;

  // https://www.w3.org/TR/html5/disabled-elements.html#concept-element-disabled
  var disabledElementsPattern = void 0;
  var disabledElements = {
    input: true,
    select: true,
    textarea: true,
    button: true,
    fieldset: true,
    form: true
  };

  module.exports = exports['default'];
});
//# sourceMappingURL=native-disabled-supported.js.map