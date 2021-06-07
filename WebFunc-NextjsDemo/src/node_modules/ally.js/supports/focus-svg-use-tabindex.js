'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _svg = require('./helper/svg');

exports.default = {
  element: 'div',
  mutate: function mutate(element) {
    element.innerHTML = (0, _svg.generate)(['<g id="ally-test-target"><a xlink:href="#void"><text>link</text></a></g>', '<use xlink:href="#ally-test-target" x="0" y="0" tabindex="-1" />'].join(''));

    return element.querySelector('use');
  },
  validate: _svg.validate
};
module.exports = exports['default'];
//# sourceMappingURL=focus-svg-use-tabindex.js.map