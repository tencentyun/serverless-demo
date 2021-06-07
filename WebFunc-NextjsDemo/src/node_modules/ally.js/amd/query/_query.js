(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './first-tabbable', './focusable', './shadow-hosts', './tabbable', './tabsequence'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./first-tabbable'), require('./focusable'), require('./shadow-hosts'), require('./tabbable'), require('./tabsequence'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.firstTabbable, global.focusable, global.shadowHosts, global.tabbable, global.tabsequence);
    global._query = mod.exports;
  }
})(this, function (module, exports, _firstTabbable, _focusable, _shadowHosts, _tabbable, _tabsequence) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _firstTabbable2 = _interopRequireDefault(_firstTabbable);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _shadowHosts2 = _interopRequireDefault(_shadowHosts);

  var _tabbable2 = _interopRequireDefault(_tabbable);

  var _tabsequence2 = _interopRequireDefault(_tabsequence);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    firstTabbable: _firstTabbable2.default,
    focusable: _focusable2.default,
    shadowHosts: _shadowHosts2.default,
    tabbable: _tabbable2.default,
    tabsequence: _tabsequence2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_query.js.map