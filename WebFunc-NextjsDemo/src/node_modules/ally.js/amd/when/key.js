(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './key.binding', '../util/node-array', '../util/compare-position'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./key.binding'), require('../util/node-array'), require('../util/compare-position'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.key, global.nodeArray, global.comparePosition);
    global.key = mod.exports;
  }
})(this, function (module, exports, _key, _nodeArray, _comparePosition) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var map = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var bindings = {};

    var context = (0, _nodeArray2.default)(map.context)[0] || document.documentElement;
    delete map.context;
    var filter = (0, _nodeArray2.default)(map.filter);
    delete map.filter;

    var mapKeys = Object.keys(map);
    if (!mapKeys.length) {
      throw new TypeError('when/key requires at least one option key');
    }

    var registerBinding = function registerBinding(event) {
      event.keyCodes.forEach(function (code) {
        if (!bindings[code]) {
          bindings[code] = [];
        }

        bindings[code].push(event);
      });
    };

    mapKeys.forEach(function (text) {
      if (typeof map[text] !== 'function') {
        throw new TypeError('when/key requires option["' + text + '"] to be a function');
      }

      var addCallback = function addCallback(event) {
        event.callback = map[text];
        return event;
      };

      (0, _key2.default)(text).map(addCallback).forEach(registerBinding);
    });

    var handleKeyDown = function handleKeyDown(event) {
      if (event.defaultPrevented) {
        return;
      }

      if (filter.length) {
        // ignore elements within the exempted sub-trees
        var isParentOfElement = (0, _comparePosition.getParentComparator)({ element: event.target, includeSelf: true });
        if (filter.some(isParentOfElement)) {
          return;
        }
      }

      var key = event.keyCode || event.which;
      if (!bindings[key]) {
        return;
      }

      bindings[key].forEach(function (_event) {
        if (!_event.matchModifiers(event)) {
          return;
        }

        _event.callback.call(context, event, disengage);
      });
    };

    context.addEventListener('keydown', handleKeyDown, false);

    var disengage = function disengage() {
      context.removeEventListener('keydown', handleKeyDown, false);
    };

    return { disengage: disengage };
  };

  var _key2 = _interopRequireDefault(_key);

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=key.js.map