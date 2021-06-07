var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Utility to make the entire DOM aria-hidden="true" except for a given set of elements

import nodeArray from '../util/node-array';
import getInsignificantBranches from '../get/insignificant-branches';
import getParents from '../get/parents';
import toggleAttributeValue from '../util/toggle-attribute-value';
import { getParentComparator } from '../util/compare-position';

function makeElementHidden(element) {
  toggleAttributeValue({
    element: element,
    attribute: 'aria-hidden',
    temporaryValue: 'true'
  });
}

function undoElementHidden(element) {
  toggleAttributeValue({
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

    this._context = nodeArray(context || document.documentElement)[0];
    this._filter = nodeArray(filter);

    this.disengage = this.disengage.bind(this);
    this.handleMutation = this.handleMutation.bind(this);
    this.isInsignificantBranch = this.isInsignificantBranch.bind(this);

    var insignificantBranches = getInsignificantBranches({ context: this._context, filter: this._filter });
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
        nodeArray(mutation.addedNodes).filter(function (element) {
          return element.nodeType === Node.ELEMENT_NODE;
        }).filter(this.isInsignificantBranch).forEach(makeElementHidden);
      }
    }
  }, {
    key: 'isInsignificantBranch',
    value: function isInsignificantBranch(element) {
      var parents = getParents({ context: element });
      if (parents.some(function (_element) {
        return _element.getAttribute('aria-hidden') === 'true';
      })) {
        // element is child of a hidden element
        return false;
      }

      var isParentOfElement = getParentComparator({ element: element });
      if (this._filter.some(isParentOfElement)) {
        // element is a descendant of a filtered element
        return false;
      }

      return true;
    }
  }]);

  return HiddenSubtree;
}();

export default function () {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref2.context,
      filter = _ref2.filter;

  var service = new HiddenSubtree({ context: context, filter: filter });
  return { disengage: service.disengage };
}
//# sourceMappingURL=hidden.js.map