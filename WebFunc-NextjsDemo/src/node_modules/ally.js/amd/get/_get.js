(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './active-element', './active-elements', './focus-redirect-target', './focus-target', './insignificant-branches', './parents', './shadow-host-parents', './shadow-host'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./active-element'), require('./active-elements'), require('./focus-redirect-target'), require('./focus-target'), require('./insignificant-branches'), require('./parents'), require('./shadow-host-parents'), require('./shadow-host'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.activeElement, global.activeElements, global.focusRedirectTarget, global.focusTarget, global.insignificantBranches, global.parents, global.shadowHostParents, global.shadowHost);
    global._get = mod.exports;
  }
})(this, function (module, exports, _activeElement, _activeElements, _focusRedirectTarget, _focusTarget, _insignificantBranches, _parents, _shadowHostParents, _shadowHost) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _activeElement2 = _interopRequireDefault(_activeElement);

  var _activeElements2 = _interopRequireDefault(_activeElements);

  var _focusRedirectTarget2 = _interopRequireDefault(_focusRedirectTarget);

  var _focusTarget2 = _interopRequireDefault(_focusTarget);

  var _insignificantBranches2 = _interopRequireDefault(_insignificantBranches);

  var _parents2 = _interopRequireDefault(_parents);

  var _shadowHostParents2 = _interopRequireDefault(_shadowHostParents);

  var _shadowHost2 = _interopRequireDefault(_shadowHost);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    activeElement: _activeElement2.default,
    activeElements: _activeElements2.default,
    focusRedirectTarget: _focusRedirectTarget2.default,
    focusTarget: _focusTarget2.default,
    insignificantBranches: _insignificantBranches2.default,
    parents: _parents2.default,
    shadowHostParents: _shadowHostParents2.default,
    shadowHost: _shadowHost2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_get.js.map