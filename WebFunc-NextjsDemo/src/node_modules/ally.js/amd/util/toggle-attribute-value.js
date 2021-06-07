(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports);
    global.toggleAttributeValue = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (_ref) {
    var element = _ref.element,
        attribute = _ref.attribute,
        temporaryValue = _ref.temporaryValue,
        saveValue = _ref.saveValue;

    var temporaryAttribute = 'data-cached-' + attribute;

    if (temporaryValue !== undefined) {
      var _value = saveValue || element.getAttribute(attribute);
      element.setAttribute(temporaryAttribute, _value || '');
      element.setAttribute(attribute, temporaryValue);
    } else {
      var _value2 = element.getAttribute(temporaryAttribute);
      element.removeAttribute(temporaryAttribute);
      if (_value2 === '') {
        element.removeAttribute(attribute);
      } else {
        element.setAttribute(attribute, _value2);
      }
    }
  };

  module.exports = exports['default'];
});
//# sourceMappingURL=toggle-attribute-value.js.map