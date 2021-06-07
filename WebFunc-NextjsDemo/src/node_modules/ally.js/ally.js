'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _element = require('./element/_element');

var _element2 = _interopRequireDefault(_element);

var _event = require('./event/_event');

var _event2 = _interopRequireDefault(_event);

var _fix = require('./fix/_fix');

var _fix2 = _interopRequireDefault(_fix);

var _get = require('./get/_get');

var _get2 = _interopRequireDefault(_get);

var _is = require('./is/_is');

var _is2 = _interopRequireDefault(_is);

var _maintain = require('./maintain/_maintain');

var _maintain2 = _interopRequireDefault(_maintain);

var _map = require('./map/_map');

var _map2 = _interopRequireDefault(_map);

var _observe = require('./observe/_observe');

var _observe2 = _interopRequireDefault(_observe);

var _query = require('./query/_query');

var _query2 = _interopRequireDefault(_query);

var _style = require('./style/_style');

var _style2 = _interopRequireDefault(_style);

var _when = require('./when/_when');

var _when2 = _interopRequireDefault(_when);

var _version = require('./version');

var _version2 = _interopRequireDefault(_version);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
//# sourceMappingURL=ally.js.map