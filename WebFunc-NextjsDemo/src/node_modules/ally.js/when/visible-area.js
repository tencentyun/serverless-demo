'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function () {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      callback = _ref.callback,
      area = _ref.area;

  if (typeof callback !== 'function') {
    throw new TypeError('when/visible-area requires options.callback to be a function');
  }

  if (typeof area !== 'number') {
    area = 1;
  }

  var element = (0, _contextToElement2.default)({
    label: 'when/visible-area',
    context: context
  });

  var raf = void 0;
  var evaluate = null;
  var disengage = function disengage() {
    raf && cancelAnimationFrame(raf);
  };

  var predicate = function predicate() {
    return !(0, _visible2.default)(element) || (0, _visibleArea2.default)(element) < area || callback(element) === false;
  };

  var checkPredicate = function checkPredicate() {
    if (predicate()) {
      evaluate();
      return;
    }

    disengage();
  };

  evaluate = function evaluate() {
    raf = requestAnimationFrame(checkPredicate);
  };

  evaluate();
  return { disengage: disengage };
};

require('../prototype/window.requestanimationframe');

var _visible = require('../is/visible');

var _visible2 = _interopRequireDefault(_visible);

var _visibleArea = require('../util/visible-area');

var _visibleArea2 = _interopRequireDefault(_visibleArea);

var _contextToElement = require('../util/context-to-element');

var _contextToElement2 = _interopRequireDefault(_contextToElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = exports['default'];
/*
  execute a callback once an element became fully visible in the viewport
*/
//# sourceMappingURL=visible-area.js.map