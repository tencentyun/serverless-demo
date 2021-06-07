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
    global.attribute = mod.exports;
  }
})(this, function (module, exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = {
    // aria state properties

    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-busy
    'aria-busy': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-checked
    'aria-checked': {
      'default': undefined,
      values: ['true', 'false', 'mixed', undefined]
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-disabled
    'aria-disabled': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-expanded
    'aria-expanded': {
      'default': undefined,
      values: ['true', 'false', undefined]
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-grabbed
    'aria-grabbed': {
      'default': undefined,
      values: ['true', 'false', undefined]
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-hidden
    'aria-hidden': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-invalid
    'aria-invalid': {
      'default': 'false',
      values: ['true', 'false', 'grammar', 'spelling']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-pressed
    'aria-pressed': {
      'default': undefined,
      values: ['true', 'false', 'mixed', undefined]
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-selected
    'aria-selected': {
      'default': undefined,
      values: ['true', 'false', undefined]
    },

    // aria descriptive properties

    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-atomic
    'aria-atomic': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-autocomplete
    'aria-autocomplete': {
      'default': 'none',
      values: ['inline', 'list', 'both', 'none']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-dropeffect
    'aria-dropeffect': {
      'default': 'none',
      multiple: true,
      values: ['copy', 'move', 'link', 'execute', 'popup', 'none']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-haspopup
    'aria-haspopup': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-live
    'aria-live': {
      'default': 'off',
      values: ['off', 'polite', 'assertive']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-multiline
    'aria-multiline': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-multiselectable
    'aria-multiselectable': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-orientation
    'aria-orientation': {
      'default': 'horizontal',
      values: ['vertical', 'horizontal']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-readonly
    'aria-readonly': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-relevant
    'aria-relevant': {
      'default': 'additions text',
      multiple: true,
      values: ['additions', 'removals', 'text', 'all']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-required
    'aria-required': {
      'default': 'false',
      values: ['true', 'false']
    },
    // https://www.w3.org/TR/wai-aria/states_and_properties#aria-sort
    'aria-sort': {
      'default': 'none',
      other: true,
      values: ['ascending', 'descending', 'none']
    }
  };
  module.exports = exports['default'];
});
//# sourceMappingURL=attribute.js.map