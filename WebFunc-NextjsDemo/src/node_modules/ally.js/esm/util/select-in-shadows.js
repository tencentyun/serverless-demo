
// convert a CSS selector so that it also pierces ShadowDOM
// takes ".a, #b" and turns it into ".a, #b, html >>> .a, html >>> #b"

import cssShadowPiercingDeepCombinator from '../supports/css-shadow-piercing-deep-combinator';

var shadowPrefix = void 0;

export default function (selector) {
  if (typeof shadowPrefix !== 'string') {
    var operator = cssShadowPiercingDeepCombinator();
    if (operator) {
      shadowPrefix = ', html ' + operator + ' ';
    }
  }

  if (!shadowPrefix) {
    return selector;
  }

  return selector + shadowPrefix + selector.replace(/\s*,\s*/g, ',').split(',').join(shadowPrefix);
}
//# sourceMappingURL=select-in-shadows.js.map