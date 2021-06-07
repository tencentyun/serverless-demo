(/* istanbul ignore next */ function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(['module', 'exports', '../util/select-in-shadows', '../supports/supports'], factory);
  } else if (typeof exports !== "undefined") {
    factory(module, exports, require('../util/select-in-shadows'), require('../supports/supports'));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod, mod.exports, global.selectInShadows, global.supports);
    global.focusable = mod.exports;
  }
})(this, function (module, exports, _selectInShadows, _supports2) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function () {
    if (!supports) {
      supports = (0, _supports3.default)();
    }

    if (typeof selector === 'string') {
      return selector;
    }

    // https://www.w3.org/TR/html5/editing.html#sequential-focus-navigation-and-the-tabindex-attribute
    selector = ''
    // IE11 supports.can focus <table> and <td>
    + (supports.focusTable ? 'table, td,' : '')
    // IE11 supports.can focus <fieldset>
    + (supports.focusFieldset ? 'fieldset,' : '')
    // Namespace problems of [xlink:href] explained in https://stackoverflow.com/a/23047888/515124
    // svg a[*|href] does not match in IE9, but since we're filtering
    // through is/focusable we can include all <a> from SVG
    + 'svg a,'
    // may behave as 'svg, svg *,' in chrome as *every* svg element with a focus event listener is focusable
    // navigational elements
    + 'a[href],'
    // validity determined by is/valid-area.js
    + 'area[href],'
    // validity determined by is/disabled.js
    + 'input, select, textarea, button,'
    // browsing context containers
    + 'iframe, object, embed,'
    // interactive content
    + 'keygen,' + (supports.focusAudioWithoutControls ? 'audio,' : 'audio[controls],') + (supports.focusVideoWithoutControls ? 'video,' : 'video[controls],') + (supports.focusSummary ? 'summary,' : '')
    // validity determined by is/valid-tabindex.js
    + '[tabindex],'
    // editing hosts
    + '[contenteditable]';

    // where ShadowDOM is supported, we also want the shadowed focusable elements (via ">>>" or "/deep/")
    selector = (0, _selectInShadows2.default)(selector);

    return selector;
  };

  var _selectInShadows2 = _interopRequireDefault(_selectInShadows);

  var _supports3 = _interopRequireDefault(_supports2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  // NOTE: this selector MUST *never* be used directly,
  // always go through query/focusable or is/focusable.js
  // there are too many edge cases that they could be covered in
  // a simple CSS selector…

  var supports = void 0;

  var selector = void 0;

  module.exports = exports['default'];
});
//# sourceMappingURL=focusable.js.map