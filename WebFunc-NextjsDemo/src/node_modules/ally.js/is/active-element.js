'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (context) {
  var element = (0, _contextToElement2.default)({
    label: 'is/active-element',
    resolveDocument: true,
    context: context
  });

  var _document = (0, _getDocument2.default)(element);
  if (_document.activeElement === element) {
    return true;
  }

  var shadowHost = (0, _shadowHost2.default)({ context: element });
  if (shadowHost && shadowHost.shadowRoot.activeElement === element) {
    return true;
  }

  return false;
};

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _shadowHost = require('../get/shadow-host');

var _shadowHost2 = _interopRequireDefault(_shadowHost);

var _getDocument = require('../util/get-document');

var _getDocument2 = _interopRequireDefault(_getDocument);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Determines if an element is the activeElement within its context, i.e. its document iFrame or ShadowHost

module.exports = exports['default'];
//# sourceMappingURL=active-element.js.map