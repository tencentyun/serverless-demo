'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = queryFocusableStrict;

var _focusable = require('../is/focusable');

var _focusable2 = _interopRequireDefault(_focusable);

var _focusRelevant = require('../is/focus-relevant');

var _focusRelevant2 = _interopRequireDefault(_focusRelevant);

var _getDocument = require('../util/get-document');

var _getDocument2 = _interopRequireDefault(_getDocument);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createFilter(condition) {
  // see https://developer.mozilla.org/en-US/docs/Web/API/NodeFilter
  var filter = function filter(node) {
    if (node.shadowRoot) {
      // return ShadowRoot elements regardless of them being focusable,
      // so they can be walked recursively later
      return NodeFilter.FILTER_ACCEPT;
    }

    if (condition(node)) {
      // finds elements that could have been found by document.querySelectorAll()
      return NodeFilter.FILTER_ACCEPT;
    }

    return NodeFilter.FILTER_SKIP;
  };
  // IE requires a function, Browsers require {acceptNode: function}
  // see http://www.bennadel.com/blog/2607-finding-html-comment-nodes-in-the-dom-using-treewalker.htm
  filter.acceptNode = filter;
  return filter;
}
// https://www.w3.org/TR/html5/editing.html#focusable
// https://www.w3.org/WAI/PF/aria-practices/#keyboard

var PossiblyFocusableFilter = createFilter(_focusRelevant2.default);

function queryFocusableStrict() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      includeContext = _ref.includeContext,
      includeOnlyTabbable = _ref.includeOnlyTabbable,
      strategy = _ref.strategy;

  if (!context) {
    context = document.documentElement;
  }

  var _isFocusable = _focusable2.default.rules.except({
    onlyTabbable: includeOnlyTabbable
  });

  var _document = (0, _getDocument2.default)(context);
  // see https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
  var walker = _document.createTreeWalker(
  // root element to start search in
  context,
  // element type filter
  NodeFilter.SHOW_ELEMENT,
  // custom NodeFilter filter
  strategy === 'all' ? PossiblyFocusableFilter : createFilter(_isFocusable),
  // deprecated, but IE requires it
  false);

  var list = [];

  while (walker.nextNode()) {
    if (walker.currentNode.shadowRoot) {
      if (_isFocusable(walker.currentNode)) {
        list.push(walker.currentNode);
      }

      list = list.concat(queryFocusableStrict({
        context: walker.currentNode.shadowRoot,
        includeOnlyTabbable: includeOnlyTabbable,
        strategy: strategy
      }));
    } else {
      list.push(walker.currentNode);
    }
  }

  // add context if requested and focusable
  if (includeContext) {
    if (strategy === 'all') {
      if ((0, _focusRelevant2.default)(context)) {
        list.unshift(context);
      }
    } else if (_isFocusable(context)) {
      list.unshift(context);
    }
  }

  return list;
}
module.exports = exports['default'];
//# sourceMappingURL=focusable.strict.js.map