(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', './tabbable', '../util/merge-dom-order', '../util/get-document', '../util/image-map'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('./tabbable'), require('../util/merge-dom-order'), require('../util/get-document'), require('../util/image-map'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.tabbable, global.mergeDomOrder, global.getDocument, global.imageMap);
    global.tabsequenceSortArea = mod.exports;
  }
})(this, function (module, exports, _tabbable, _mergeDomOrder, _getDocument, _imageMap) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (elements, context) {
    // images - unless they are focusable themselves, likely not
    // part of the elements list, so we'll have to find them and
    // sort them into the elements list manually
    var usemaps = context.querySelectorAll('img[usemap]');
    var maps = new Maps(context);

    // remove all <area> elements from the elements list,
    // but put them the map for later retrieval
    var _elements = maps.extractAreasFromList(elements);

    if (!usemaps.length) {
      // the context does not contain any <area>s so no need
      // to replace anything, just remove any maps
      return _elements;
    }

    return (0, _mergeDomOrder2.default)({
      list: _elements,
      elements: usemaps,
      resolveElement: function resolveElement(image) {
        var name = image.getAttribute('usemap').slice(1);
        return maps.getAreasFor(name);
      }
    });
  };

  var _tabbable2 = _interopRequireDefault(_tabbable);

  var _mergeDomOrder2 = _interopRequireDefault(_mergeDomOrder);

  var _getDocument2 = _interopRequireDefault(_getDocument);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  var _createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var Maps = function () {
    function Maps(context) {
      _classCallCheck(this, Maps);

      this._document = (0, _getDocument2.default)(context);
      this.maps = {};
    }

    _createClass(Maps, [{
      key: 'getAreasFor',
      value: function getAreasFor(name) {
        if (!this.maps[name]) {
          // the map is not defined within the context, so we
          // have to go find it elsewhere in the document
          this.addMapByName(name);
        }

        return this.maps[name];
      }
    }, {
      key: 'addMapByName',
      value: function addMapByName(name) {
        var map = (0, _imageMap.getMapByName)(name, this._document);
        if (!map) {
          // if there is no map, the img[usemap] wasn't doing anything anyway
          return;
        }

        this.maps[map.name] = (0, _tabbable2.default)({ context: map });
      }
    }, {
      key: 'extractAreasFromList',
      value: function extractAreasFromList(elements) {
        // remove all <area> elements from the elements list,
        // but put them the map for later retrieval
        return elements.filter(function (element) {
          var nodeName = element.nodeName.toLowerCase();
          if (nodeName !== 'area') {
            return true;
          }

          var map = element.parentNode;
          if (!this.maps[map.name]) {
            this.maps[map.name] = [];
          }

          this.maps[map.name].push(element);
          return false;
        }, this);
      }
    }]);

    return Maps;
  }();

  module.exports = exports['default'];
});
//# sourceMappingURL=tabsequence.sort-area.js.map