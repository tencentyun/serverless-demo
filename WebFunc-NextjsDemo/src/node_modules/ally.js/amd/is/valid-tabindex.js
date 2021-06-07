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
    global.validTabindex = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context) {
    if (!supports) {
      supports = (0, _supports3.default)();
    }

    var validIntegerPattern = supports.focusTabindexTrailingCharacters ? validIntegerPatternWithTrailing : validIntegerPatternNoTrailing;

    var element = (0, _contextToElement2.default)({
      label: 'is/valid-tabindex',
      resolveDocument: true,
      context: context
    });

    // Edge 14 has a capitalization problem on SVG elements,
    // see https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/9282058/
    var hasTabindex = element.hasAttribute('tabindex');
    var hasTabIndex = element.hasAttribute('tabIndex');

    if (!hasTabindex && !hasTabIndex) {
      return false;
    }

    // older Firefox and Internet Explorer don't support tabindex on SVG elements
    var isSvgElement = element.ownerSVGElement || element.nodeName.toLowerCase() === 'svg';
    if (isSvgElement && !supports.focusSvgTabindexAttribute) {
      return false;
    }

    // @browser-issue Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
    if (supports.focusInvalidTabindex) {
      return true;
    }

    // an element matches the tabindex selector even if its value is invalid
    var tabindex = element.getAttribute(hasTabindex ? 'tabindex' : 'tabIndex');
    // IE11 parses tabindex="" as the value "-32768"
    // @browser-issue Trident https://connect.microsoft.com/IE/feedback/details/1072965
    if (tabindex === '-32768') {
      return false;
    }

    return Boolean(tabindex && validIntegerPattern.test(tabindex));
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // determine if an element's tabindex attribute has a valid value

  var supports = void 0;

  // https://www.w3.org/TR/html5/infrastructure.html#rules-for-parsing-integers
  // NOTE: all browsers agree to allow trailing spaces as well
  var validIntegerPatternNoTrailing = /^\s*(-|\+)?[0-9]+\s*$/;
  var validIntegerPatternWithTrailing = /^\s*(-|\+)?[0-9]+.*$/;

  module.exports = exports['default'];
});
//# sourceMappingURL=valid-tabindex.js.map