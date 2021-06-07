'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      includeContext = _ref.includeContext,
      includeOnlyTabbable = _ref.includeOnlyTabbable,
      strategy = _ref.strategy;

  var _isTabbable = _tabbable2.default.rules.except({
    onlyTabbable: includeOnlyTabbable
  });

  return (0, _focusable2.default)({
    context: context,
    includeContext: includeContext,
    includeOnlyTabbable: includeOnlyTabbable,
    strategy: strategy
  }).filter(_isTabbable);
};

var _focusable = require('./focusable');

var _focusable2 = _interopRequireDefault(_focusable);

var _tabbable = require('../is/tabbable');

var _tabbable2 = _interopRequireDefault(_tabbable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
// https://www.w3.org/TR/html5/editing.html#sequential-focus-navigation-and-the-tabindex-attribute
// https://www.w3.org/WAI/PF/aria-practices/#keyboard
//# sourceMappingURL=tabbable.js.map