(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './active-element', './disabled', './focus-relevant', './focusable', './only-tabbable', './shadowed', './tabbable', './valid-area', './valid-tabindex', './visible'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./active-element'), require('./disabled'), require('./focus-relevant'), require('./focusable'), require('./only-tabbable'), require('./shadowed'), require('./tabbable'), require('./valid-area'), require('./valid-tabindex'), require('./visible'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.activeElement, global.disabled, global.focusRelevant, global.focusable, global.onlyTabbable, global.shadowed, global.tabbable, global.validArea, global.validTabindex, global.visible);
    global._is = mod.exports;
  }
})(this, function (module, exports, _activeElement, _disabled, _focusRelevant, _focusable, _onlyTabbable, _shadowed, _tabbable, _validArea, _validTabindex, _visible) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _activeElement2 = _interopRequireDefault(_activeElement);

  var _disabled2 = _interopRequireDefault(_disabled);

  var _focusRelevant2 = _interopRequireDefault(_focusRelevant);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _onlyTabbable2 = _interopRequireDefault(_onlyTabbable);

  var _shadowed2 = _interopRequireDefault(_shadowed);

  var _tabbable2 = _interopRequireDefault(_tabbable);

  var _validArea2 = _interopRequireDefault(_validArea);

  var _validTabindex2 = _interopRequireDefault(_validTabindex);

  var _visible2 = _interopRequireDefault(_visible);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  exports.default = {
    activeElement: _activeElement2.default,
    disabled: _disabled2.default,
    focusRelevant: _focusRelevant2.default,
    focusable: _focusable2.default,
    onlyTabbable: _onlyTabbable2.default,
    shadowed: _shadowed2.default,
    tabbable: _tabbable2.default,
    validArea: _validArea2.default,
    validTabindex: _validTabindex2.default,
    visible: _visible2.default
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=_is.js.map