'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// Polyfill originally copied from https://developer.mozilla.org/en/docs/Web/API/CustomEvent#Polyfill
// and rewritten to *not* pollute global space because of CustomEvent being an object Internet Explorer 11
// https://msdn.microsoft.com/en-us/library/ff974338(v=vs.85).aspx

var _CustomEvent = typeof window !== 'undefined' && window.CustomEvent || function () {};

if (typeof _CustomEvent !== 'function') {
  _CustomEvent = function CustomEventPolyfill(event, params) {
    var evt = document.createEvent('CustomEvent');

    !params && (params = {
      bubbles: false,
      cancelable: false,
      detail: undefined
    });

    evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
    return evt;
  };

  _CustomEvent.prototype = window.Event.prototype;
}

exports.default = _CustomEvent;
module.exports = exports['default'];
//# sourceMappingURL=window.customevent.js.map