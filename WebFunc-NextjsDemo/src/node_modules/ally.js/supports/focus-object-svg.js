'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _svg = require('./media/svg');

var _svg2 = _interopRequireDefault(_svg);

var _platform = require('../util/platform');

var _platform2 = _interopRequireDefault(_platform);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Note: IE10 on BrowserStack does not like this test

exports.default = {
  name: 'can-focus-object-svg',
  element: 'object',
  mutate: function mutate(element) {
    element.setAttribute('type', 'image/svg+xml');
    element.setAttribute('data', _svg2.default);
    element.setAttribute('width', '200');
    element.setAttribute('height', '50');
  },
  validate: function validate(element, focusTarget, _document) {
    if (_platform2.default.is.GECKO) {
      // Firefox seems to be handling the object creation asynchronously and thereby produces a false negative test result.
      // Because we know Firefox is able to focus object elements referencing SVGs, we simply cheat by sniffing the user agent string
      return true;
    }

    return _document.activeElement === element;
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-object-svg.js.map