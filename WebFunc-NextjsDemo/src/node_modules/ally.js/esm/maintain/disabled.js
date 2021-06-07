var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
  Utility to make a sub-tree of the DOM inert. Inert means the elements cannot be interacted
  with and they cannot be focused via script, pointer or keyboard.

  inert attribute was [removed](https://html5.org/r/8536) [tweet by steve](https://twitter.com/stevefaulkner/status/443075900201259008)
  but definition of [inert subtrees](https://www.w3.org/html/wg/drafts/html/master/editing.html#inert-subtrees) remains.

  [implementation idea by Vasilis](https://codepen.io/vasilisvg/pen/scowI)
  [inert attribute polyfill by GoogleChrome](https://github.com/GoogleChrome/inert-polyfill)

  [Gecko Bug: Inert Attribute](https://bugzilla.mozilla.org/show_bug.cgi?id=921504)
  [Chromium Bug: Inert Attribute](https://code.google.com/p/chromium/issues/detail?id=269846)
  [Chromium Bug: Inert Subtree](https://code.google.com/p/chromium/issues/detail?id=241699)
  [WebKit Bug: Inert Subtree](https://bugs.webkit.org/show_bug.cgi?id=110952)
*/

import nodeArray from '../util/node-array';
import queryFocusable from '../query/focusable';
import elementDisabled from '../element/disabled';
import observeShadowMutations from '../observe/shadow-mutations';
import { getParentComparator } from '../util/compare-position';

function makeElementInert(element) {
  return elementDisabled(element, true);
}

function undoElementInert(element) {
  return elementDisabled(element, false);
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

    this._context = nodeArray(context || document.documentElement)[0];
    this._filter = nodeArray(filter);
    this._inertElementCache = [];

    this.disengage = this.disengage.bind(this);
    this.handleMutation = this.handleMutation.bind(this);
    this.renderInert = this.renderInert.bind(this);
    this.filterElements = this.filterElements.bind(this);
    this.filterParentElements = this.filterParentElements.bind(this);

    var focusable = queryFocusable({
      context: this._context,
      includeContext: true,
      strategy: 'all'
    });

    this.renderInert(focusable);

    this.shadowObserver = observeShadowMutations({
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
        return queryFocusable({ context: element, includeContext: true, strategy: 'all' });
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
        return !elementDisabled(element);
      }).forEach(makeInert);
    }
  }, {
    key: 'filterElements',
    value: function filterElements(element) {
      // ignore elements within the exempted sub-trees
      var isParentOfElement = getParentComparator({ element: element, includeSelf: true });
      return !this._filter.some(isParentOfElement);
    }
  }, {
    key: 'filterParentElements',
    value: function filterParentElements(element) {
      // ignore ancestors of the exempted sub-trees
      var isParentOfElement = getParentComparator({ parent: element });
      return !this._filter.some(isParentOfElement);
    }
  }, {
    key: 'handleMutation',
    value: function handleMutation(mutation) {
      if (mutation.type === 'childList') {
        var addedElements = nodeArray(mutation.addedNodes).filter(function (element) {
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

export default function () {
  var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref2.context,
      filter = _ref2.filter;

  var service = new InertSubtree({ context: context, filter: filter });
  return { disengage: service.disengage };
}
//# sourceMappingURL=disabled.js.map