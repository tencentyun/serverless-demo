'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// Children of focusable elements with display:flex are focusable in IE10-11
exports.default = {
  element: 'div',
  mutate: function mutate(element) {
    element.setAttribute('tabindex', '-1');
    element.setAttribute('style', 'display: -webkit-flex; display: -ms-flexbox; display: flex;');
    element.innerHTML = '<span style="display: block;">hello</span>';
    return element.querySelector('span');
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-children-of-focusable-flexbox.js.map