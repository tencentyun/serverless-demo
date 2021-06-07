(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/node-array', '../get/insignificant-branches', '../get/parents', '../util/toggle-attribute-value', '../util/compare-position'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/node-array'), require('../get/insignificant-branches'), require('../get/parents'), require('../util/toggle-attribute-value'), require('../util/compare-position'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.nodeArray, global.insignificantBranches, global.parents, global.toggleAttributeValue, global.comparePosition);
    global.hidden = mod.exports;
  }
})(this, function (module, exports, _nodeArray, _insignificantBranches, _parents, _toggleAttributeValue, _comparePosition) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref2.context,
        filter = _ref2.filter;

    var service = new HiddenSubtree({ context: context, filter: filter });
    return { disengage: service.disengage };
  };

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  var _insignificantBranches2 = _interopRequireDefault(_insignificantBranches);

  var _parents2 = _interopRequireDefault(_parents);

  var _toggleAttributeValue2 = _interopRequireDefault(_toggleAttributeValue);

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

  function makeElementHidden(element) {
    (0, _toggleAttributeValue2.default)({
      element: element,
      attribute: 'aria-hidden',
      temporaryValue: 'true'
    });
  }

  function undoElementHidden(element) {
    (0, _toggleAttributeValue2.default)({
      element: element,
      attribute: 'aria-hidden'
    });
  }

  var observerConfig = {
    attributes: false,
    childList: true,
    subtree: true
  };

  var HiddenSubtree = function () {
    function HiddenSubtree() {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          context = _ref.context,
          filter = _ref.filter;

      _classCallCheck(this, HiddenSubtree);

      this._context = (0, _nodeArray2.default)(context || document.documentElement)[0];
      this._filter = (0, _nodeArray2.default)(filter);

      this.disengage = this.disengage.bind(this);
      this.handleMutation = this.handleMutation.bind(this);
      this.isInsignificantBranch = this.isInsignificantBranch.bind(this);

      var insignificantBranches = (0, _insignificantBranches2.default)({ context: this._context, filter: this._filter });
      insignificantBranches.forEach(makeElementHidden);
      this.startObserver();
    }

    _createClass(HiddenSubtree, [{
      key: 'disengage',
      value: function disengage() {
        if (!this._context) {
          return;
        }

        [].forEach.call(this._context.querySelectorAll('[data-cached-aria-hidden]'), undoElementHidden);

        this._context = null;
        this._filter = null;
        this._observer && this._observer.disconnect();
        this._observer = null;
      }
    }, {
      key: 'startObserver',
      value: function startObserver() {
        var _this = this;

        if (!window.MutationObserver) {
          // not supporting IE10 via Mutation Events, because they're too expensive
          // https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Mutation_events
          return;
        }
        // http://caniuse.com/#search=mutation
        // https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver
        this._observer = new MutationObserver(function (mutations) {
          return mutations.forEach(_this.handleMutation);
        });
        this._observer.observe(this._context, observerConfig);
      }
    }, {
      key: 'handleMutation',
      value: function handleMutation(mutation) {
        if (mutation.type === 'childList') {
          // a new branch cannot contain a filtered element
          // (unless it is moved there, which is an edge-case we'll ignore for now),
          // so anything that is within context,
          // and not within a previously known insignificant branch and not within a filtered element,
          // must be an insignificant branch as well
          (0, _nodeArray2.default)(mutation.addedNodes).filter(function (element) {
            return element.nodeType === Node.ELEMENT_NODE;
          }).filter(this.isInsignificantBranch).forEach(makeElementHidden);
        }
      }
    }, {
      key: 'isInsignificantBranch',
      value: function isInsignificantBranch(element) {
        var parents = (0, _parents2.default)({ context: element });
        if (parents.some(function (_element) {
          return _element.getAttribute('aria-hidden') === 'true';
        })) {
          // element is child of a hidden element
          return false;
        }

        var isParentOfElement = (0, _comparePosition.getParentComparator)({ element: element });
        if (this._filter.some(isParentOfElement)) {
          // element is a descendant of a filtered element
          return false;
        }

        return true;
      }
    }]);

    return HiddenSubtree;
  }();

  module.exports = exports['default'];
});
//# sourceMappingURL=hidden.js.map