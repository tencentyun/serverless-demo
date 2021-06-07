
// https://www.w3.org/TR/html5/editing.html#focusable
// https://www.w3.org/WAI/PF/aria-practices/#keyboard

import isFocusable from '../is/focusable';
import isFocusRelevant from '../is/focus-relevant';
import getDocument from '../util/get-document';

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

var PossiblyFocusableFilter = createFilter(isFocusRelevant);

export default function queryFocusableStrict() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      context = _ref.context,
      includeContext = _ref.includeContext,
      includeOnlyTabbable = _ref.includeOnlyTabbable,
      strategy = _ref.strategy;

  if (!context) {
    context = document.documentElement;
  }

  var _isFocusable = isFocusable.rules.except({
    onlyTabbable: includeOnlyTabbable
  });

  var _document = getDocument(context);
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
      if (isFocusRelevant(context)) {
        list.unshift(context);
      }
    } else if (_isFocusable(context)) {
      list.unshift(context);
    }
  }

  return list;
}
//# sourceMappingURL=focusable.strict.js.map