'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// form[tabindex=0][disabled] should be focusable as the
// specification doesn't know the disabled attribute on the form element
// @specification https://www.w3.org/TR/html5/forms.html#the-form-element
exports.default = {
  element: 'form',
  mutate: function mutate(element) {
    element.setAttribute('tabindex', 0);
    element.setAttribute('disabled', 'disabled');
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-form-disabled.js.map