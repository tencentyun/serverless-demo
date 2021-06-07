'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// elements with display:flex are focusable in IE10-11
exports.default = {
  element: 'span',
  mutate: function mutate(element) {
    element.setAttribute('style', 'display: -webkit-flex; display: -ms-flexbox; display: flex;');
    element.innerHTML = '<span style="display: block;">hello</span>';
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-flexbox-container.js.map