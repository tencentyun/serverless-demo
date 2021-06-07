'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// Firefox allows *any* value and treats invalid values like tabindex="-1"
// @browser-issue Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1128054
exports.default = {
  element: 'div',
  mutate: function mutate(element) {
    element.setAttribute('tabindex', '3x');
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-tabindex-trailing-characters.js.map