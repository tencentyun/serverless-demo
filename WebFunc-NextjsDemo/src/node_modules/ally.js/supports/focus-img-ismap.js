'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gif = require('./media/gif');

var _gif2 = _interopRequireDefault(_gif);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// NOTE: https://github.com/medialize/ally.js/issues/35
// fixes https://github.com/medialize/ally.js/issues/20
// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-ismap
exports.default = {
  element: 'a',
  mutate: function mutate(element) {
    element.href = '#void';
    element.innerHTML = '<img ismap src="' + _gif2.default + '" alt="">';
    return element.querySelector('img');
  }
};
module.exports = exports['default'];
//# sourceMappingURL=focus-img-ismap.js.map