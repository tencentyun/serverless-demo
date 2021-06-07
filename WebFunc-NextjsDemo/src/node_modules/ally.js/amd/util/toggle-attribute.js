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
    global.toggleAttribute = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (_ref) {
    var element = _ref.element,
        attribute = _ref.attribute;

    var temporaryAttribute = 'data-cached-' + attribute;
    var temporaryAttributeValue = element.getAttribute(temporaryAttribute);

    if (temporaryAttributeValue === null) {
      var _value = element.getAttribute(attribute);
      if (_value === null) {
        // can't remove what's not there
        return;
      }

      element.setAttribute(temporaryAttribute, _value || '');
      element.removeAttribute(attribute);
    } else {
      var _value2 = element.getAttribute(temporaryAttribute);
      element.removeAttribute(temporaryAttribute);
      element.setAttribute(attribute, _value2);
    }
  };

  module.exports = exports['default'];
});
//# sourceMappingURL=toggle-attribute.js.map