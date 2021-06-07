(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './disabled', './hidden', './tab-focus'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./disabled'), require('./hidden'), require('./tab-focus'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.disabled, global.hidden, global.tabFocus);
    global._maintain = mod.exports;
  }
})(this, function (module, exports, _disabled, _hidden, _tabFocus) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _disabled2 = _interopRequireDefault(_disabled);

  var _hidden2 = _interopRequireDefault(_hidden);

  var _tabFocus2 = _interopRequireDefault(_tabFocus);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    disabled: _disabled2.default,
    hidden: _hidden2.default,
    tabFocus: _tabFocus2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_maintain.js.map