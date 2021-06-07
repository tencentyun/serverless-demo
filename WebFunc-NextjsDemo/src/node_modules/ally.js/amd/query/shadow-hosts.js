(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', '../util/get-document'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('../util/get-document'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.getDocument);
    global.shadowHosts = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _getDocument) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = queryShadowHosts;

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // see https://developer.mozilla.org/en-US/docs/Web/API/NodeFilter
  var filter = function filter(node) {
    if (node.shadowRoot) {
      return NodeFilter.FILTER_ACCEPT;
    }

    return NodeFilter.FILTER_SKIP;
  };
  // IE requires a function, Browsers require {acceptNode: function}
  // see http://www.bennadel.com/blog/2607-finding-html-comment-nodes-in-the-dom-using-treewalker.htm
  filter.acceptNode = filter;

  function queryShadowHosts() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context;

    var element = (0, _contextToElement2.default)({
      label: 'query/shadow-hosts',
      resolveDocument: true,
      defaultToDocument: true,
      context: context
    });

    var _document = (0, _getDocument2.default)(context);
    // see https://developer.mozilla.org/en-US/docs/Web/API/Document/createTreeWalker
    var walker = _document.createTreeWalker(
    // root element to start search in
    element,
    // element type filter
    NodeFilter.SHOW_ELEMENT,
    // custom NodeFilter filter
    filter,
    // deprecated, but IE requires it
    false);

    var list = [];

    if (element.shadowRoot) {
      // TreeWalker does not run the filter on the context element
      list.push(element);
      list = list.concat(queryShadowHosts({
        context: element.shadowRoot
      }));
    }

    while (walker.nextNode()) {
      list.push(walker.currentNode);
      list = list.concat(queryShadowHosts({
        context: walker.currentNode.shadowRoot
      }));
    }

    return list;
  }
  module.exports = exports['default'];
});
//# sourceMappingURL=shadow-hosts.js.map