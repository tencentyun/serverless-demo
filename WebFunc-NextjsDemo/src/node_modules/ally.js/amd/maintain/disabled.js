(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/node-array', '../query/focusable', '../element/disabled', '../observe/shadow-mutations', '../util/compare-position'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/node-array'), require('../query/focusable'), require('../element/disabled'), require('../observe/shadow-mutations'), require('../util/compare-position'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.nodeArray, global.focusable, global.disabled, global.shadowMutations, global.comparePosition);
    global.disabled = mod.exports;
  }
})(this, function (module, exports, _nodeArray, _focusable, _disabled, _shadowMutations, _comparePosition) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref2.context,
        filter = _ref2.filter;

    var service = new InertSubtree({ context: context, filter: filter });
    return { disengage: service.disengage };
  };

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  var _focusable2 = _interopRequireDefault(_focusable);

  var _disabled2 = _interopRequireDefault(_disabled);

  var _shadowMutations2 = _interopRequireDefault(_shadowMutations);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

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

  function makeElementInert(element) {
    return (0, _disabled2.default)(element, true);
  }

  function undoElementInert(element) {
    return (0, _disabled2.default)(element, false);
  }

  var observerConfig = {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ['tabindex', 'disabled', 'data-ally-disabled']
  };

  var InertSubtree = function () {
    function InertSubtree() {
      var _this = this;

      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          context = _ref.context,
          filter = _ref.filter;

      _classCallCheck(this, InertSubtree);

      this._context = (0, _nodeArray2.default)(context || document.documentElement)[0];
      this._filter = (0, _nodeArray2.default)(filter);
      this._inertElementCache = [];

      this.disengage = this.disengage.bind(this);
      this.handleMutation = this.handleMutation.bind(this);
      this.renderInert = this.renderInert.bind(this);
      this.filterElements = this.filterElements.bind(this);
      this.filterParentElements = this.filterParentElements.bind(this);

      var focusable = (0, _focusable2.default)({
        context: this._context,
        includeContext: true,
        strategy: 'all'
      });

      this.renderInert(focusable);

      this.shadowObserver = (0, _shadowMutations2.default)({
        context: this._context,
        config: observerConfig,
        callback: function callback(mutations) {
          return mutations.forEach(_this.handleMutation);
        }
      });
    }

    _createClass(InertSubtree, [{
      key: 'disengage',
      value: function disengage() {
        if (!this._context) {
          return;
        }

        undoElementInert(this._context);
        this._inertElementCache.forEach(function (element) {
          return undoElementInert(element);
        });

        this._inertElementCache = null;
        this._filter = null;
        this._context = null;
        this.shadowObserver && this.shadowObserver.disengage();
        this.shadowObserver = null;
      }
    }, {
      key: 'listQueryFocusable',
      value: function listQueryFocusable(list) {
        return list
        // find all focusable elements within the given contexts
        .map(function (element) {
          return (0, _focusable2.default)({ context: element, includeContext: true, strategy: 'all' });
        })
        // flatten nested arrays
        .reduce(function (previous, current) {
          return previous.concat(current);
        }, []);
      }
    }, {
      key: 'renderInert',
      value: function renderInert(elements) {
        var _this2 = this;

        var makeInert = function makeInert(element) {
          _this2._inertElementCache.push(element);
          makeElementInert(element);
        };

        elements.filter(this.filterElements).filter(this.filterParentElements)
        // ignore elements that already are disabled
        // so we don't enable them on disengage()
        .filter(function (element) {
          return !(0, _disabled2.default)(element);
        }).forEach(makeInert);
      }
    }, {
      key: 'filterElements',
      value: function filterElements(element) {
        // ignore elements within the exempted sub-trees
        var isParentOfElement = (0, _comparePosition.getParentComparator)({ element: element, includeSelf: true });
        return !this._filter.some(isParentOfElement);
      }
    }, {
      key: 'filterParentElements',
      value: function filterParentElements(element) {
        // ignore ancestors of the exempted sub-trees
        var isParentOfElement = (0, _comparePosition.getParentComparator)({ parent: element });
        return !this._filter.some(isParentOfElement);
      }
    }, {
      key: 'handleMutation',
      value: function handleMutation(mutation) {
        if (mutation.type === 'childList') {
          var addedElements = (0, _nodeArray2.default)(mutation.addedNodes).filter(function (element) {
            return element.nodeType === Node.ELEMENT_NODE;
          });
          if (!addedElements.length) {
            return;
          }

          var addedFocusableElements = this.listQueryFocusable(addedElements);
          this.renderInert(addedFocusableElements);
        } else if (mutation.type === 'attributes') {
          this.renderInert([mutation.target]);
        }
      }
    }]);

    return InertSubtree;
  }();

  module.exports = exports['default'];
});
//# sourceMappingURL=disabled.js.map