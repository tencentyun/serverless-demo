'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (context) {
  if (!supports) {
    supports = (0, _supports3.default)();
  }

  var element = (0, _contextToElement2.default)({
    label: 'is/disabled',
    context: context
  });

  if (element.hasAttribute('data-ally-disabled')) {
    // treat ally's element/disabled like the DOM native element.disabled
    return true;
  }

  if (!(0, _nativeDisabledSupported2.default)(element)) {
    // non-form elements do not support the disabled attribute
    return false;
  }

  if (element.disabled) {
    // the element itself is disabled
    return true;
  }

  var parents = (0, _parents2.default)({ context: element });
  if (parents.some(isDisabledFieldset)) {
    // a parental <fieldset> is disabld and inherits the state onto this element
    return true;
  }

  if (!supports.focusFormDisabled && parents.some(isDisabledForm)) {
    // a parental <form> is disabld and inherits the state onto this element
    return true;
  }

  return false;
};

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

var _parents = require('../get/parents');

var _parents2 = _interopRequireDefault(_parents);

var _nativeDisabledSupported = require('./native-disabled-supported');

var _nativeDisabledSupported2 = _interopRequireDefault(_nativeDisabledSupported);

var _supports2 = require('../supports/supports');

var _supports3 = _interopRequireDefault(_supports2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Determine if an element is disabled (i.e. not editable)

var supports = void 0;

function isDisabledFieldset(element) {
  var nodeName = element.nodeName.toLowerCase();
  return nodeName === 'fieldset' && element.disabled;
}

function isDisabledForm(element) {
  var nodeName = element.nodeName.toLowerCase();
  return nodeName === 'form' && element.disabled;
}

module.exports = exports['default'];
//# sourceMappingURL=disabled.js.map