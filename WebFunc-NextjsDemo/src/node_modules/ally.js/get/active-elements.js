'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  if (document.activeElement === null) {
    // IE10 does not redirect focus to <body> when the activeElement is removed
    document.body.focus();
  }

  // Firefox currently leaks the shadowed element
  // @browser-issue Gecko https://bugzilla.mozilla.org/show_bug.cgi?id=1117535
  if ((0, _shadowed2.default)(document.activeElement)) {
    return walkFromShadowedElement();
  }

  return walkToShadowedElement();
};

var _shadowed = require('../is/shadowed');

var _shadowed2 = _interopRequireDefault(_shadowed);

var _shadowHostParents = require('./shadow-host-parents');

var _shadowHostParents2 = _interopRequireDefault(_shadowHostParents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// [0] always is the actual active element (even within web-components)
// [0+n] is the hierarchy of shadow-doms with [length -1] being the top most shadow-host

function walkToShadowedElement() {
  var list = [document.activeElement];

  while (list[0] && list[0].shadowRoot) {
    list.unshift(list[0].shadowRoot.activeElement);
  }

  return list;
}

function walkFromShadowedElement() {
  var hosts = (0, _shadowHostParents2.default)({ context: document.activeElement });
  return [document.activeElement].concat(hosts);
}

module.exports = exports['default'];
//# sourceMappingURL=active-elements.js.map