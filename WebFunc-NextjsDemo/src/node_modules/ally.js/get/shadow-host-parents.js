'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context;

  var list = [];
  var element = (0, _contextToElement2.default)({
    label: 'get/shadow-host-parents',
    context: context
  });

  while (element) {
    element = (0, _shadowHost2.default)({ context: element });
    if (!element) {
      break;
    }

    list.push(element);
  }

  return list;
};

var _shadowHost = require('./shadow-host');

var _shadowHost2 = _interopRequireDefault(_shadowHost);

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
//# sourceMappingURL=shadow-host-parents.js.map