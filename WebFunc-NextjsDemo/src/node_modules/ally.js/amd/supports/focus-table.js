(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports);
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports);
    global.focusTable = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    element: 'table',
    mutate: function mutate(element, wrapper, _document) {
      // IE9 has a problem replacing TBODY contents with innerHTML.
      // https://stackoverflow.com/a/8097055/515124
      // element.innerHTML = '<tr><td>cell</td></tr>';
      var fragment = _document.createDocumentFragment();
      fragment.innerHTML = '<tr><td>cell</td></tr>';
      element.appendChild(fragment);
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-table.js.map