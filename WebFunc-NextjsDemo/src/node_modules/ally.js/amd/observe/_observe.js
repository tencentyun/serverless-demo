(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './interaction-type', './shadow-mutations'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./interaction-type'), require('./shadow-mutations'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.interactionType, global.shadowMutations);
    global._observe = mod.exports;
  }
})(this, function (module, exports, _interactionType, _shadowMutations) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _interactionType2 = _interopRequireDefault(_interactionType);

  var _shadowMutations2 = _interopRequireDefault(_shadowMutations);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    interactionType: _interactionType2.default,
    shadowMutations: _shadowMutations2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_observe.js.map