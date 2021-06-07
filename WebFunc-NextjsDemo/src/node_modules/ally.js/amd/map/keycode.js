(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports);
    global.keycode = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  // codes mostly cloned from https://github.com/keithamus/jwerty/blob/master/jwerty.js
  // deliberately not exposing characters like <,.-#* because they vary *wildly*
  // across keyboard layouts and may cause various problems
  // (e.g. "*" is "Shift +" on a German Mac keyboard)
  // (e.g. "@" is "Alt L" on a German Mac keyboard)

  var keycode = {
    // Element Focus
    tab: 9,

    // Navigation
    left: 37,
    up: 38,
    right: 39,
    down: 40,
    pageUp: 33,
    'page-up': 33,
    pageDown: 34,
    'page-down': 34,
    end: 35,
    home: 36,

    // Action
    enter: 13,
    escape: 27,
    space: 32,

    // Modifier
    shift: 16,
    capsLock: 20,
    'caps-lock': 20,
    ctrl: 17,
    alt: 18,
    meta: 91,
    // in firefox: 224
    // on mac (chrome): meta-left=91, meta-right=93
    // on win (IE11): meta-left=91, meta-right=92
    pause: 19,

    // Content Manipulation
    insert: 45,
    'delete': 46,
    backspace: 8,

    // the same logical key may be identified through different keyCodes
    _alias: {
      91: [92, 93, 224]
    }
  };

  // Function keys (112 - 137)
  // NOTE: not every keyboard knows F13+
  for (var n = 1; n < 26; n++) {
    keycode['f' + n] = n + 111;
  }

  // Number keys (48-57, numpad 96-105)
  // NOTE: not every keyboard knows num-0+
  for (var _n = 0; _n < 10; _n++) {
    var code = _n + 48;
    var numCode = _n + 96;
    keycode[_n] = code;
    keycode['num-' + _n] = numCode;
    keycode._alias[code] = [numCode];
  }

  // Latin characters (65 - 90)
  for (var _n2 = 0; _n2 < 26; _n2++) {
    var _code = _n2 + 65;
    var name = String.fromCharCode(_code).toLowerCase();
    keycode[name] = _code;
  }

  exports.default = keycode;
  module.exports = exports['default'];
});
//# sourceMappingURL=keycode.js.map