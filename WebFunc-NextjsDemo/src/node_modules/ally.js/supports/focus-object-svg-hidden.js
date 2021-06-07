'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _svg = require('./media/svg');

var _svg2 = _interopRequireDefault(_svg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Note: IE10 on BrowserStack does not like this test

exports.default = {
  element: 'object',
  mutate: function mutate(element) {
    element.setAttribute('type', 'image/svg+xml');
    element.setAttribute('data', _svg2.default);
    element.setAttribute('width', '200');
    element.setAttribute('height', '50');
    element.style.visibility = 'hidden';
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-object-svg-hidden.js.map