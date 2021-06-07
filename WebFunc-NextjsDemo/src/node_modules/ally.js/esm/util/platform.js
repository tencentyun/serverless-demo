
// sugar for https://github.com/bestiejs/platform.js
// make sure to ALWAYS reference the layout engine,
// even if it is not necessary for the condition,
// as this makes grepping for this stuff simpler

import _platform from 'platform';

// deep clone of original platform
var platform = JSON.parse(JSON.stringify(_platform));

// operating system
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

export default platform;
//# sourceMappingURL=platform.js.map