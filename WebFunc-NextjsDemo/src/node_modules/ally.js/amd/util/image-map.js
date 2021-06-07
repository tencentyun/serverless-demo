(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['exports', 'css.escape', '../util/get-document'], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require('css.escape'), require('../util/get-document'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.css, global.getDocument);
    global.imageMap = mod.exports;
  }
})(this, function (exports, _css, _getDocument) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.getMapByName = getMapByName;
  exports.getMapOfImage = getMapOfImage;
  exports.getImageOfArea = getImageOfArea;

  var _css2 = _interopRequireDefault(_css);

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function getMapByName(name, _document) {
    // apparently getElementsByName() also considers id attribute in IE & opera
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByName
    var map = _document.querySelector('map[name="' + (0, _css2.default)(name) + '"]');
    return map || null;
  }

  function getMapOfImage(element) {
    var usemap = element.getAttribute('usemap');
    if (!usemap) {
      return null;
    }

    var _document = (0, _getDocument2.default)(element);
    return getMapByName(usemap.slice(1), _document);
  }

  function getImageOfArea(element) {
    var map = element.parentElement;

    if (!map.name || map.nodeName.toLowerCase() !== 'map') {
      return null;
    }

    // NOTE: image maps can also be applied to <object> with image content,
    // but no browser supports this at the moment

    // HTML5 specifies HTMLMapElement.images to be an HTMLCollection of all
    // <img> and <object> referencing the <map> element, but no browser implements this
    //   https://www.w3.org/TR/html5/embedded-content-0.html#the-map-element
    //   https://developer.mozilla.org/en-US/docs/Web/API/HTMLMapElement
    // the image must be valid and loaded for the map to take effect
    var _document = (0, _getDocument2.default)(element);
    return _document.querySelector('img[usemap="#' + (0, _css2.default)(map.name) + '"]') || null;
  }
});
//# sourceMappingURL=image-map.js.map