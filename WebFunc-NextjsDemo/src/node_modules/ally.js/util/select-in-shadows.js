'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (selector) {
  if (typeof shadowPrefix !== 'string') {
    var operator = (0, _cssShadowPiercingDeepCombinator2.default)();
    if (operator) {
      shadowPrefix = ', html ' + operator + ' ';
    }
  }

  if (!shadowPrefix) {
    return selector;
  }

  return selector + shadowPrefix + selector.replace(/\s*,\s*/g, ',').split(',').join(shadowPrefix);
};

var _cssShadowPiercingDeepCombinator = require('../supports/css-shadow-piercing-deep-combinator');

var _cssShadowPiercingDeepCombinator2 = _interopRequireDefault(_cssShadowPiercingDeepCombinator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var shadowPrefix = void 0;
// convert a CSS selector so that it also pierces ShadowDOM
// takes ".a, #b" and turns it into ".a, #b, html >>> .a, html >>> #b"

module.exports = exports['default'];
//# sourceMappingURL=select-in-shadows.js.map