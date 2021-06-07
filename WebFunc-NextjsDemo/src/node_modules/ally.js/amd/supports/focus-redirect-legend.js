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
    global.focusRedirectLegend = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    element: 'fieldset',
    mutate: function mutate(element) {
      element.innerHTML = '<legend>legend</legend><input tabindex="-1"><input tabindex="0">';
      // take care of focus in validate();
      return false;
    },
    validate: function validate(element, focusTarget, _document) {
      var focusable = element.querySelector('input[tabindex="-1"]');
      var tabbable = element.querySelector('input[tabindex="0"]');

      // Firefox requires this test to focus the <fieldset> first, while this is not necessary in
      // https://jsbin.com/nenirisage/edit?html,js,console,output
      element.focus();

      element.querySelector('legend').focus();
      return _document.activeElement === focusable && 'focusable' || _document.activeElement === tabbable && 'tabbable' || '';
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=focus-redirect-legend.js.map