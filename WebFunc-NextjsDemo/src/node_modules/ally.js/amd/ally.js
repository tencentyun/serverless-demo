(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './element/_element', './event/_event', './fix/_fix', './get/_get', './is/_is', './maintain/_maintain', './map/_map', './observe/_observe', './query/_query', './style/_style', './when/_when', './version'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./element/_element'), require('./event/_event'), require('./fix/_fix'), require('./get/_get'), require('./is/_is'), require('./maintain/_maintain'), require('./map/_map'), require('./observe/_observe'), require('./query/_query'), require('./style/_style'), require('./when/_when'), require('./version'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global._element, global._event, global._fix, global._get, global._is, global._maintain, global._map, global._observe, global._query, global._style, global._when, global.version);
    global.ally = mod.exports;
  }
})(this, function (module, exports, _element, _event, _fix, _get, _is, _maintain, _map, _observe, _query, _style, _when, _version) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _element2 = _interopRequireDefault(_element);

  var _event2 = _interopRequireDefault(_event);

  var _fix2 = _interopRequireDefault(_fix);

  var _get2 = _interopRequireDefault(_get);

  var _is2 = _interopRequireDefault(_is);

  var _maintain2 = _interopRequireDefault(_maintain);

  var _map2 = _interopRequireDefault(_map);

  var _observe2 = _interopRequireDefault(_observe);

  var _query2 = _interopRequireDefault(_query);

  var _style2 = _interopRequireDefault(_style);

  var _when2 = _interopRequireDefault(_when);

  var _version2 = _interopRequireDefault(_version);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // save current window.ally for noConflict()

  // this builds up the UMD bundle

  var conflicted = typeof window !== 'undefined' && window.ally;

  exports.default = {
    element: _element2.default,
    event: _event2.default,
    fix: _fix2.default,
    get: _get2.default,
    is: _is2.default,
    maintain: _maintain2.default,
    map: _map2.default,
    observe: _observe2.default,
    query: _query2.default,
    style: _style2.default,
    when: _when2.default,
    version: _version2.default,
    noConflict: function noConflict() {
      if (typeof window !== 'undefined' && window.ally === this) {
        window.ally = conflicted;
      }

      return this;
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=ally.js.map