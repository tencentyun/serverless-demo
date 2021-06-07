'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (elements, context, sortElements) {
  var shadows = new Shadows(context, sortElements);
  var _elements = shadows.extractElements(elements);

  if (_elements.length === elements.length) {
    // no shadowed content found, no need to continue
    return sortElements(elements);
  }

  return shadows.sort(_elements);
};

var _shadowHost = require('../get/shadow-host');

var _shadowHost2 = _interopRequireDefault(_shadowHost);

var _mergeDomOrder = require('../util/merge-dom-order');

var _mergeDomOrder2 = _interopRequireDefault(_mergeDomOrder);

var _tabindexValue = require('../util/tabindex-value');

var _tabindexValue2 = _interopRequireDefault(_tabindexValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Shadows = function () {
  function Shadows(context, sortElements) {
    _classCallCheck(this, Shadows);

    // document context we're working with
    this.context = context;
    // callback that sorts an array of elements
    this.sortElements = sortElements;
    // reference to create unique IDs for each ShadowHost
    this.hostCounter = 1;
    // reference map for child-ShadowHosts of a ShadowHost
    this.inHost = {};
    // reference map for child-ShadowHost of the document
    this.inDocument = [];
    // reference map for ShadowHosts
    this.hosts = {};
    // reference map for tabbable elements of a ShadowHost
    this.elements = {};
  }

  // remember which hosts we have to sort within later


  _createClass(Shadows, [{
    key: '_registerHost',
    value: function _registerHost(host) {
      if (host._sortingId) {
        return;
      }

      // make the ShadowHost identifiable (see cleanup() for undo)
      host._sortingId = 'shadow-' + this.hostCounter++;
      this.hosts[host._sortingId] = host;

      // hosts may contain other hosts
      var parentHost = (0, _shadowHost2.default)({ context: host });
      if (parentHost) {
        this._registerHost(parentHost);
        this._registerHostParent(host, parentHost);
      } else {
        this.inDocument.push(host);
      }
    }

    // remember which host is the child of which other host

  }, {
    key: '_registerHostParent',
    value: function _registerHostParent(host, parent) {
      if (!this.inHost[parent._sortingId]) {
        this.inHost[parent._sortingId] = [];
      }

      this.inHost[parent._sortingId].push(host);
    }

    // remember which elements a host contains

  }, {
    key: '_registerElement',
    value: function _registerElement(element, host) {
      if (!this.elements[host._sortingId]) {
        this.elements[host._sortingId] = [];
      }

      this.elements[host._sortingId].push(element);
    }

    // remove shadowed elements from the sequence and register
    // the ShadowHosts they belong to so we know what to sort
    // later on

  }, {
    key: 'extractElements',
    value: function extractElements(elements) {
      return elements.filter(function (element) {
        var host = (0, _shadowHost2.default)({ context: element });
        if (!host) {
          return true;
        }

        this._registerHost(host);
        this._registerElement(element, host);
        return false;
      }, this);
    }

    // inject hosts into the sequence, sort everything,
    // and recoursively replace hosts by its descendants

  }, {
    key: 'sort',
    value: function sort(elements) {
      var _elements = this._injectHosts(elements);
      _elements = this._replaceHosts(_elements);
      this._cleanup();
      return _elements;
    }

    // merge ShadowHosts into the element lists of other ShadowHosts
    // or the document, then sort the individual lists

  }, {
    key: '_injectHosts',
    value: function _injectHosts(elements) {
      Object.keys(this.hosts).forEach(function (_sortingId) {
        var _list = this.elements[_sortingId];
        var _elements = this.inHost[_sortingId];
        var _context = this.hosts[_sortingId].shadowRoot;
        this.elements[_sortingId] = this._merge(_list, _elements, _context);
      }, this);

      return this._merge(elements, this.inDocument, this.context);
    }
  }, {
    key: '_merge',
    value: function _merge(list, elements, context) {
      var merged = (0, _mergeDomOrder2.default)({
        list: list,
        elements: elements
      });

      return this.sortElements(merged, context);
    }
  }, {
    key: '_replaceHosts',
    value: function _replaceHosts(elements) {
      return (0, _mergeDomOrder2.default)({
        list: elements,
        elements: this.inDocument,
        resolveElement: this._resolveHostElement.bind(this)
      });
    }
  }, {
    key: '_resolveHostElement',
    value: function _resolveHostElement(host) {
      var merged = (0, _mergeDomOrder2.default)({
        list: this.elements[host._sortingId],
        elements: this.inHost[host._sortingId],
        resolveElement: this._resolveHostElement.bind(this)
      });

      var _tabindex = (0, _tabindexValue2.default)(host);
      if (_tabindex !== null && _tabindex > -1) {
        return [host].concat(merged);
      }

      return merged;
    }
  }, {
    key: '_cleanup',
    value: function _cleanup() {
      // remove those identifers we put on the ShadowHost to avoid using Map()
      Object.keys(this.hosts).forEach(function (key) {
        delete this.hosts[key]._sortingId;
      }, this);
    }
  }]);

  return Shadows;
}();

module.exports = exports['default'];
//# sourceMappingURL=tabsequence.sort-shadowed.js.map