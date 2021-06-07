'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = {
  element: 'details',
  mutate: function mutate(element) {
    element.innerHTML = '<summary>foo</summary><p>content</p>';
    return element.firstElementChild;
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-summary.js.map