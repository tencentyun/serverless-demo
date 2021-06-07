(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', '../../element/focus.svg-foreign-object-hack'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('../../element/focus.svg-foreign-object-hack'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.focus);
    global.svg = mod.exports;
  }
})(this, function (exports, _focus) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.generate = generate;
  exports.focus = focus;
  exports.validate = validate;

  var _focus2 = _interopRequireDefault(_focus);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function generate(element) {
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' + element + '</svg>';
  }

  function focus(element) {
    if (element.focus) {
      return;
    }

    try {
      HTMLElement.prototype.focus.call(element);
    } catch (e) {
      (0, _focus2.default)(element);
    }
  }

  function validate(element, focusTarget, _document) {
    focus(focusTarget);
    return _document.activeElement === focusTarget;
  }
});
//# sourceMappingURL=svg.js.map