const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_core = require('./fast-json-patch/src/core.cjs');
const require_duplex = require('./fast-json-patch/src/duplex.cjs');
require('./fast-json-patch/index.cjs');

//#region src/utils/json_patch.ts
var json_patch_exports = {};
require_rolldown_runtime.__export(json_patch_exports, {
	applyPatch: () => require_core.applyPatch,
	compare: () => require_duplex.compare
});

//#endregion
exports.applyPatch = require_core.applyPatch;
exports.compare = require_duplex.compare;
Object.defineProperty(exports, 'json_patch_exports', {
  enumerable: true,
  get: function () {
    return json_patch_exports;
  }
});
//# sourceMappingURL=json_patch.cjs.map