(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './media/gif'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./media/gif'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.gif);
    global.focusRedirectImgUsemap = mod.exports;
  }
})(this, function (module, exports, _gif) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _gif2 = _interopRequireDefault(_gif);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    element: 'div',
    mutate: function mutate(element) {
      element.innerHTML = '<map name="focus-redirect-img-usemap"><area href="#void" shape="rect" coords="63,19,144,45"></map>' + '<img usemap="#focus-redirect-img-usemap" alt="" ' + 'src="' + _gif2.default + '">';

      // focus the <img>, not the <div>
      return element.querySelector('img');
    },
    validate: function validate(element, focusTarget, _document) {
      var target = element.querySelector('area');
      return _document.activeElement === target;
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-redirect-img-usemap.js.map