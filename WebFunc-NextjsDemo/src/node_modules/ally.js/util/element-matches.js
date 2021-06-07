'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = elementMatches;

// Element.prototype.matches may be available at a different name
// https://developer.mozilla.org/en/docs/Web/API/Element/matches

var names = ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector'];
var name = null;

function findMethodName(element) {
  names.some(function (_name) {
    if (!element[_name]) {
      return false;
    }

    name = _name;
    return true;
  });
}

function elementMatches(element, selector) {
  if (!name) {
    findMethodName(element);
  }

  return element[name](selector);
}
module.exports = exports['default'];
//# sourceMappingURL=element-matches.js.map