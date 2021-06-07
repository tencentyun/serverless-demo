(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/node-array', '../query/shadow-hosts', '../util/context-to-element'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/node-array'), require('../query/shadow-hosts'), require('../util/context-to-element'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.nodeArray, global.shadowHosts, global.contextToElement);
    global.shadowMutations = mod.exports;
  }
})(this, function (module, exports, _nodeArray, _shadowHosts, _contextToElement) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref2.context,
        callback = _ref2.callback,
        config = _ref2.config;

    if (typeof callback !== 'function') {
      throw new TypeError('observe/shadow-mutations requires options.callback to be a function');
    }

    if ((typeof config === 'undefined' ? 'undefined' : _typeof(config)) !== 'object') {
      throw new TypeError('observe/shadow-mutations requires options.config to be an object');
    }

    if (!window.MutationObserver) {
      // not supporting IE10 via Mutation Events, because they're too expensive
      // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events
      return {
        disengage: function disengage() {}
      };
    }

    var element = (0, _contextToElement2.default)({
      label: 'observe/shadow-mutations',
      resolveDocument: true,
      defaultToDocument: true,
      context: context
    });

    var service = new ShadowMutationObserver({
      context: element,
      callback: callback,
      config: config
    });

    return {
      disengage: service.disengage
    };
  };

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  var _shadowHosts2 = _interopRequireDefault(_shadowHosts);

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
  };

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var shadowObserverConfig = {
    childList: true,
    subtree: true
  };

  var ShadowMutationObserver = function () {
    function ShadowMutationObserver() {
      var _this = this;

      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          context = _ref.context,
          callback = _ref.callback,
          config = _ref.config;

      _classCallCheck(this, ShadowMutationObserver);

      this.config = config;

      this.disengage = this.disengage.bind(this);

      this.clientObserver = new MutationObserver(callback);
      this.hostObserver = new MutationObserver(function (mutations) {
        return mutations.forEach(_this.handleHostMutation, _this);
      });

      this.observeContext(context);
      this.observeShadowHosts(context);
    }

    _createClass(ShadowMutationObserver, [{
      key: 'disengage',
      value: function disengage() {
        this.clientObserver && this.clientObserver.disconnect();
        this.clientObserver = null;
        this.hostObserver && this.hostObserver.disconnect();
        this.hostObserver = null;
      }
    }, {
      key: 'observeShadowHosts',
      value: function observeShadowHosts(context) {
        var _this2 = this;

        var hosts = (0, _shadowHosts2.default)({
          context: context
        });

        hosts.forEach(function (element) {
          return _this2.observeContext(element.shadowRoot);
        });
      }
    }, {
      key: 'observeContext',
      value: function observeContext(context) {
        this.clientObserver.observe(context, this.config);
        this.hostObserver.observe(context, shadowObserverConfig);
      }
    }, {
      key: 'handleHostMutation',
      value: function handleHostMutation(mutation) {
        if (mutation.type !== 'childList') {
          return;
        }

        var addedElements = (0, _nodeArray2.default)(mutation.addedNodes).filter(function (element) {
          return element.nodeType === Node.ELEMENT_NODE;
        });
        addedElements.forEach(this.observeShadowHosts, this);
      }
    }]);

    return ShadowMutationObserver;
  }();

  module.exports = exports['default'];
});
//# sourceMappingURL=shadow-mutations.js.map