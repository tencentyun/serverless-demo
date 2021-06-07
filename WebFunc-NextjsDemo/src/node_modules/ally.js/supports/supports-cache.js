'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _version = require('../version');

var _version2 = _interopRequireDefault(_version);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function readLocalStorage(key) {
  // allow reading from storage to retrieve previous support results
  // even while the document does not have focus
  var data = void 0;

  try {
    data = window.localStorage && window.localStorage.getItem(key);
    data = data ? JSON.parse(data) : {};
  } catch (e) {
    data = {};
  }

  return data;
} /*
      Facility to cache test results in localStorage.
  
      USAGE:
        cache.get('key');
        cache.set('key', 'value');
   */

function writeLocalStorage(key, value) {
  if (!document.hasFocus()) {
    // if the document does not have focus when tests are executed, focus() may
    // not be handled properly and events may not be dispatched immediately.
    // This can happen when a document is reloaded while Developer Tools have focus.
    try {
      window.localStorage && window.localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }

    return;
  }

  try {
    window.localStorage && window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // ignore
  }
}

var userAgent = typeof window !== 'undefined' && window.navigator.userAgent || '';
var cacheKey = 'ally-supports-cache';
var cache = readLocalStorage(cacheKey);

// update the cache if ally or the user agent changed (newer version, etc)
if (cache.userAgent !== userAgent || cache.version !== _version2.default) {
  cache = {};
}

cache.userAgent = userAgent;
cache.version = _version2.default;

exports.default = {
  get: function get() {
    return cache;
  },
  set: function set(values) {
    Object.keys(values).forEach(function (key) {
      cache[key] = values[key];
    });

    cache.time = new Date().toISOString();
    writeLocalStorage(cacheKey, cache);
  }
};
module.exports = exports['default'];
//# sourceMappingURL=supports-cache.js.map