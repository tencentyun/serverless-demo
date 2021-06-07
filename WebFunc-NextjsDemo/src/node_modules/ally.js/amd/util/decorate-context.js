(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/node-array'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/node-array'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.nodeArray);
    global.decorateContext = mod.exports;
  }
})(this, function (module, exports, _nodeArray) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        engage = _ref2.engage,
        disengage = _ref2.disengage;

    var data = {
      engage: engage || noop,
      disengage: disengage || noop,
      context: null
    };

    return initialize.bind(data);
  };

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function destruct() /* {force: false} */{
    if (!this.context) {
      return;
    }

    this.context.forEach(this.disengage);
    this.context = null;
    this.engage = null;
    this.disengage = null;
  }
  /*
    The Context Decorator is intended to allow modules to easily map dis/engage methods to the general
    dis/engage and context API format
  */

  function initialize() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context;

    this.context = (0, _nodeArray2.default)(context || document);
    this.context.forEach(this.engage);
    return {
      disengage: destruct.bind(this)
    };
  }

  function noop() {}

  module.exports = exports['default'];
});
//# sourceMappingURL=decorate-context.js.map