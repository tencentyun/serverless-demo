(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/context-to-element', './visible', '../get/parents', '../util/image-map', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/context-to-element'), require('./visible'), require('../get/parents'), require('../util/image-map'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.contextToElement, global.visible, global.parents, global.imageMap, global.supports);
    global.validArea = mod.exports;
  }
})(this, function (module, exports, _contextToElement, _visible, _parents, _imageMap, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (context) {
    if (!supports) {
      supports = (0, _supports3.default)();
    }

    var element = (0, _contextToElement2.default)({
      label: 'is/valid-area',
      context: context
    });

    var nodeName = element.nodeName.toLowerCase();
    if (nodeName !== 'area') {
      return false;
    }

    var hasTabindex = element.hasAttribute('tabindex');
    if (!supports.focusAreaTabindex && hasTabindex) {
      // Blink and WebKit do not consider <area tabindex="-1" href="#void"> focusable
      return false;
    }

    var img = (0, _imageMap.getImageOfArea)(element);
    if (!img || !(0, _visible2.default)(img)) {
      return false;
    }

    // Firefox only allows fully loaded images to reference image maps
    // https://stereochro.me/ideas/detecting-broken-images-js
    if (!supports.focusBrokenImageMap && (!img.complete || !img.naturalHeight || img.offsetWidth <= 0 || img.offsetHeight <= 0)) {
      return false;
    }

    // Firefox supports.can focus area elements even if they don't have an href attribute
    if (!supports.focusAreaWithoutHref && !element.href) {
      // Internet explorer supports.can focus area elements without href if either
      // the area element or the image element has a tabindex attribute
      return supports.focusAreaTabindex && hasTabindex || supports.focusAreaImgTabindex && img.hasAttribute('tabindex');
    }

    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-usemap
    var childOfInteractive = (0, _parents2.default)({ context: img }).slice(1).some(function (_element) {
      var name = _element.nodeName.toLowerCase();
      return name === 'button' || name === 'a';
    });

    if (childOfInteractive) {
      return false;
    }

    return true;
  };

  var _contextToElement2 = _interopRequireDefault(_contextToElement);

  var _visible2 = _interopRequireDefault(_visible);

  var _parents2 = _interopRequireDefault(_parents);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var supports = void 0;

  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/map
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-usemap
  // https://github.com/jquery/jquery-ui/blob/master/ui/core.js#L88-L107

  // determine if an <area> element is being properly used by and <img> via a <map>

  module.exports = exports['default'];
});
//# sourceMappingURL=valid-area.js.map