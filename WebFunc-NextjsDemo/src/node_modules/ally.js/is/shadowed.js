'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (context) {
  var element = (0, _contextToElement2.default)({
    label: 'is/shadowed',
    resolveDocument: true,
    context: context
  });

  return Boolean((0, _shadowHost2.default)({ context: element }));
};

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _shadowHost = require('../get/shadow-host');

var _shadowHost2 = _interopRequireDefault(_shadowHost);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
// determine if an element is the child of a ShadowRoot
//# sourceMappingURL=shadowed.js.map