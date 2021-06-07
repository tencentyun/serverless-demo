(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './get-content-document', './get-window', './select-in-shadows'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./get-content-document'), require('./get-window'), require('./select-in-shadows'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.getContentDocument, global.getWindow, global.selectInShadows);
    global.getFrameElement = mod.exports;
  }
})(this, function (module, exports, _getContentDocument, _getWindow, _selectInShadows) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getFrameElement;

  var _getContentDocument2 = _interopRequireDefault(_getContentDocument);

  var _getWindow2 = _interopRequireDefault(_getWindow);

  var _selectInShadows2 = _interopRequireDefault(_selectInShadows);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var selector = void 0;

  function findDocumentHostElement(_window) {
    if (!selector) {
      selector = (0, _selectInShadows2.default)('object, iframe');
    }

    if (_window._frameElement !== undefined) {
      return _window._frameElement;
    }

    _window._frameElement = null;

    var potentialHosts = _window.parent.document.querySelectorAll(selector);
    [].some.call(potentialHosts, function (element) {
      var _document = (0, _getContentDocument2.default)(element);
      if (_document !== _window.document) {
        return false;
      }

      _window._frameElement = element;
      return true;
    });

    return _window._frameElement;
  }

  function getFrameElement(element) {
    var _window = (0, _getWindow2.default)(element);
    if (!_window.parent || _window.parent === _window) {
      // if there is no parent browsing context,
      // we're not going to get a frameElement either way
      return null;
    }

    try {
      // see https://developer.mozilla.org/en-US/docs/Web/API/Window/frameElement
      // does not work within <embed> anywhere, and not within in <object> in IE
      return _window.frameElement || findDocumentHostElement(_window);
    } catch (e) {
      return null;
    }
  }
  module.exports = exports['default'];
});
//# sourceMappingURL=get-frame-element.js.map