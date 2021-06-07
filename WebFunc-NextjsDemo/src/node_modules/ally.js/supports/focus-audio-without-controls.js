'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mp = require('./media/mp3');

var _mp2 = _interopRequireDefault(_mp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  name: 'can-focus-audio-without-controls',
  element: 'audio',
  mutate: function mutate(element) {
    try {
      // invalid media file can trigger warning in console, data-uri to prevent HTTP request
      element.setAttribute('src', _mp2.default);
    } catch (e) {
      // IE9 may throw "Error: Not implemented"
    }
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-audio-without-controls.js.map