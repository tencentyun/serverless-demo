"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = findIndex;
function findIndex(array, callback) {
  // attempt to use native or polyfilled Array#findIndex first
  if (array.findIndex) {
    return array.findIndex(callback);
  }

  var length = array.length;

  // shortcut if the array is empty
  if (length === 0) {
    return -1;
  }

  // otherwise loop over array
  for (var i = 0; i < length; i++) {
    if (callback(array[i], i, array)) {
      return i;
    }
  }

  return -1;
}
module.exports = exports["default"];
//# sourceMappingURL=array-find-index.js.map