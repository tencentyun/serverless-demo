'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = collectScrollPositions;

var _parents = require('../get/parents');

var _parents2 = _interopRequireDefault(_parents);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function collectScrollPositions(element) {
  var parents = (0, _parents2.default)({ context: element });
  var list = parents.slice(1).map(function (element) {
    return {
      element: element,
      scrollTop: element.scrollTop,
      scrollLeft: element.scrollLeft
    };
  });

  return function resetScrollPositions() {
    list.forEach(function (entry) {
      entry.element.scrollTop = entry.scrollTop;
      entry.element.scrollLeft = entry.scrollLeft;
    });
  };
}
module.exports = exports['default'];
//# sourceMappingURL=reset-scrolling.js.map