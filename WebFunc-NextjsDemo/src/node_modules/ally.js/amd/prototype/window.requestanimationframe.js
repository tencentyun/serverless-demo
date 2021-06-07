(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof exports !== "undefined") {
    factory();
  } else {
    var mod = {
      exports: {}
    };
    factory();
    global.windowRequestanimationframe = mod.exports;
  }
})(this, function () {
  'use strict';

  // Polyfill requestAnimationFrame for oldIE
  // adapted from https://gist.github.com/paulirish/1579671
  // requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel
  // original source was published under the MIT license
  // https://paulirish.com/2011/requestanimationframe-for-smart-animating/
  // http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

  typeof window !== 'undefined' && function () {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    var requestAnimationFrameName = '';
    var cancelAnimationFrameName = '';

    for (var x = 0, length = vendors.length; x < length; ++x) {
      requestAnimationFrameName = window[vendors[x] + 'RequestAnimationFrame'];
      cancelAnimationFrameName = window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (typeof window.requestAnimationFrame !== 'function') {
      window.requestAnimationFrame = window[requestAnimationFrameName] || function (callback) {
        var currTime = new Date().getTime();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var id = window.setTimeout(function () {
          callback(currTime + timeToCall);
        }, timeToCall);

        lastTime = currTime + timeToCall;
        return id;
      };
    }

    if (typeof window.cancelAnimationFrame !== 'function') {
      window.cancelAnimationFrame = window[cancelAnimationFrameName] || function (id) {
        clearTimeout(id);
      };
    }
  }();
});
//# sourceMappingURL=window.requestanimationframe.js.map