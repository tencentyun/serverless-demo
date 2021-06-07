'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// https://github.com/medialize/ally.js/issues/21
exports.default = {
  element: 'div',
  mutate: function mutate(element) {
    element.setAttribute('style', 'width: 100px; height: 50px; overflow: auto;');
    element.innerHTML = '<div style="width: 500px; height: 40px;">scrollable content</div>';
    return element.querySelector('div');
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-scroll-body.js.map