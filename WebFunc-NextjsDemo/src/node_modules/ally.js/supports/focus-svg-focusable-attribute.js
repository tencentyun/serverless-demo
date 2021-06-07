'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _svg = require('./helper/svg');

exports.default = {
  element: 'div',
  mutate: function mutate(element) {
    element.innerHTML = (0, _svg.generate)('<text focusable="true">a</text>');
    return element.querySelector('text');
  },
  validate: _svg.validate
};
module.exports = exports['default'];
//# sourceMappingURL=focus-svg-focusable-attribute.js.map