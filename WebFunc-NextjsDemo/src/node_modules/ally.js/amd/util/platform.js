(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', 'platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.platform);
    global.platform = mod.exports;
  }
})(this, function (module, exports, _platform2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _platform3 = _interopRequireDefault(_platform2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // deep clone of original platform
  var platform = JSON.parse(JSON.stringify(_platform3.default));

  // operating system

  // sugar for https://github.com/bestiejs/platform.js
  // make sure to ALWAYS reference the layout engine,
  // even if it is not necessary for the condition,
  // as this makes grepping for this stuff simpler

  var os = platform.os.family || '';
  var ANDROID = os === 'Android';
  var WINDOWS = os.slice(0, 7) === 'Windows';
  var OSX = os === 'OS X';
  var IOS = os === 'iOS';

  // layout
  var BLINK = platform.layout === 'Blink';
  var GECKO = platform.layout === 'Gecko';
  var TRIDENT = platform.layout === 'Trident';
  var EDGE = platform.layout === 'EdgeHTML';
  var WEBKIT = platform.layout === 'WebKit';

  // browser version (not layout engine version!)
  var version = parseFloat(platform.version);
  var majorVersion = Math.floor(version);
  platform.majorVersion = majorVersion;

  platform.is = {
    // operating system
    ANDROID: ANDROID,
    WINDOWS: WINDOWS,
    OSX: OSX,
    IOS: IOS,
    // layout
    BLINK: BLINK, // "Chrome", "Chrome Mobile", "Opera"
    GECKO: GECKO, // "Firefox"
    TRIDENT: TRIDENT, // "Internet Explorer"
    EDGE: EDGE, // "Microsoft Edge"
    WEBKIT: WEBKIT, // "Safari"
    // INTERNET EXPLORERS
    IE9: TRIDENT && majorVersion === 9,
    IE10: TRIDENT && majorVersion === 10,
    IE11: TRIDENT && majorVersion === 11
  };

  exports.default = platform;
  module.exports = exports['default'];
});
//# sourceMappingURL=platform.js.map