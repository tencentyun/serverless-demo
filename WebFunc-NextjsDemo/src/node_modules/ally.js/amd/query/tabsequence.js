(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './tabbable', '../util/node-array', '../util/platform', './tabsequence.sort-area', './tabsequence.sort-shadowed', './tabsequence.sort-tabindex', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./tabbable'), require('../util/node-array'), require('../util/platform'), require('./tabsequence.sort-area'), require('./tabsequence.sort-shadowed'), require('./tabsequence.sort-tabindex'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.tabbable, global.nodeArray, global.platform, global.tabsequence, global.tabsequence, global.tabsequence, global.supports);
    global.tabsequence = mod.exports;
  }
})(this, function (module, exports, _tabbable, _nodeArray, _platform, _tabsequence, _tabsequence3, _tabsequence5, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        context = _ref.context,
        includeContext = _ref.includeContext,
        includeOnlyTabbable = _ref.includeOnlyTabbable,
        strategy = _ref.strategy;

    if (!supports) {
      supports = (0, _supports3.default)();
    }

    var _context = (0, _nodeArray2.default)(context)[0] || document.documentElement;
    var elements = (0, _tabbable2.default)({
      context: _context,
      includeContext: includeContext,
      includeOnlyTabbable: includeOnlyTabbable,
      strategy: strategy
    });

    if (document.body.createShadowRoot && _platform2.default.is.BLINK) {
      // sort tabindex localized to shadow dom
      // see https://github.com/medialize/ally.js/issues/6
      elements = (0, _tabsequence4.default)(elements, _context, sortElements);
    } else {
      elements = sortElements(elements, _context);
    }

    if (includeContext) {
      // if we include the context itself, it has to be the first
      // element of the sequence
      elements = moveContextToBeginning(elements, _context);
    }

    return elements;
  };

  var _tabbable2 = _interopRequireDefault(_tabbable);

  var _nodeArray2 = _interopRequireDefault(_nodeArray);

  var _platform2 = _interopRequireDefault(_platform);

  var _tabsequence2 = _interopRequireDefault(_tabsequence);

  var _tabsequence4 = _interopRequireDefault(_tabsequence3);

  var _tabsequence6 = _interopRequireDefault(_tabsequence5);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var supports = void 0;
  // https://www.w3.org/TR/html5/editing.html#sequential-focus-navigation-and-the-tabindex-attribute
  // https://www.w3.org/WAI/PF/aria-practices/#keyboard

  function moveContextToBeginning(elements, context) {
    var pos = elements.indexOf(context);
    if (pos > 0) {
      var tmp = elements.splice(pos, 1);
      return tmp.concat(elements);
    }

    return elements;
  }

  function sortElements(elements, _context) {
    if (supports.tabsequenceAreaAtImgPosition) {
      // Some browsers sort <area> in DOM order, some place the <area>s
      // where the <img> referecing them would've been in DOM order.
      // https://github.com/medialize/ally.js/issues/5
      elements = (0, _tabsequence2.default)(elements, _context);
    }

    elements = (0, _tabsequence6.default)(elements);
    return elements;
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=tabsequence.js.map