(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/platform'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/platform'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.platform);
    global.detectFocus = mod.exports;
  }
})(this, function (module, exports, _platform) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (tests) {
    var data = before();

    var results = {};
    Object.keys(tests).map(function (key) {
      results[key] = test(data, tests[key]);
    });

    after(data);
    return results;
  };

  var _platform2 = _interopRequireDefault(_platform);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function before() {
    var data = {
      // remember what had focus to restore after test
      activeElement: document.activeElement,
      // remember scroll positions to restore after test
      windowScrollTop: window.scrollTop,
      windowScrollLeft: window.scrollLeft,
      bodyScrollTop: document.body.scrollTop,
      bodyScrollLeft: document.body.scrollLeft
    };

    // wrap tests in an element hidden from screen readers to prevent them
    // from announcing focus, which can be quite irritating to the user
    var iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'position:absolute; position:fixed; top:0; left:-2px; width:1px; height:1px; overflow:hidden;');
    iframe.setAttribute('aria-live', 'off');
    iframe.setAttribute('aria-busy', 'true');
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    var _window = iframe.contentWindow;
    var _document = _window.document;

    _document.open();
    _document.close();
    var wrapper = _document.createElement('div');
    _document.body.appendChild(wrapper);

    data.iframe = iframe;
    data.wrapper = wrapper;
    data.window = _window;
    data.document = _document;

    return data;
  }

  // options.element:
  //  {string} element name
  //  {function} callback(wrapper, document) to generate an element
  // options.mutate: (optional)
  //  {function} callback(element, wrapper, document) to manipulate element prior to focus-test.
  //             Can return DOMElement to define focus target (default: element)
  // options.validate: (optional)
  //  {function} callback(element, focusTarget, document) to manipulate test-result
  function test(data, options) {
    // make sure we operate on a clean slate
    data.wrapper.innerHTML = '';
    // create dummy element to test focusability of
    var element = typeof options.element === 'string' ? data.document.createElement(options.element) : options.element(data.wrapper, data.document);
    // allow callback to further specify dummy element
    // and optionally define element to focus
    var focus = options.mutate && options.mutate(element, data.wrapper, data.document);
    if (!focus && focus !== false) {
      focus = element;
    }
    // element needs to be part of the DOM to be focusable
    !element.parentNode && data.wrapper.appendChild(element);
    // test if the element with invalid tabindex can be focused
    focus && focus.focus && focus.focus();
    // validate test's result
    return options.validate ? options.validate(element, focus, data.document) : data.document.activeElement === focus;
  }

  function after(data) {
    // restore focus to what it was before test and cleanup
    if (data.activeElement === document.body) {
      document.activeElement && document.activeElement.blur && document.activeElement.blur();
      if (_platform2.default.is.IE10) {
        // IE10 does not redirect focus to <body> when the activeElement is removed
        document.body.focus();
      }
    } else {
      data.activeElement && data.activeElement.focus && data.activeElement.focus();
    }

    document.body.removeChild(data.iframe);

    // restore scroll position
    window.scrollTop = data.windowScrollTop;
    window.scrollLeft = data.windowScrollLeft;
    document.body.scrollTop = data.bodyScrollTop;
    document.body.scrollLeft = data.bodyScrollLeft;
  }

  module.exports = exports['default'];
});
//# sourceMappingURL=detect-focus.js.map