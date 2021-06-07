'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

// fieldset[tabindex=0][disabled] should not be focusable, but Blink and WebKit disagree
// @specification https://www.w3.org/TR/html5/disabled-elements.html#concept-element-disabled
// @browser-issue Chromium https://crbug.com/453847
// @browser-issue WebKit https://bugs.webkit.org/show_bug.cgi?id=141086
exports.default = {
  element: 'fieldset',
  mutate: function mutate(element) {
    element.setAttribute('tabindex', 0);
    element.setAttribute('disabled', 'disabled');
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-fieldset-disabled.js.map