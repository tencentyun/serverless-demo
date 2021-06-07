'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (node) {
  var _document = (0, _getDocument2.default)(node);
  return _document.defaultView || window;
};

var _getDocument = require('./get-document');

var _getDocument2 = _interopRequireDefault(_getDocument);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
//# sourceMappingURL=get-window.js.map