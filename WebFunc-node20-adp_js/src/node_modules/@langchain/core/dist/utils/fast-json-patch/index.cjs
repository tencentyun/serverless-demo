const require_helpers = require('./src/helpers.cjs');
const require_core = require('./src/core.cjs');
const require_duplex = require('./src/duplex.cjs');

//#region src/utils/fast-json-patch/index.ts
var fast_json_patch_default = {
	...require_core.core_exports,
	JsonPatchError: require_helpers.PatchError,
	deepClone: require_helpers._deepClone,
	escapePathComponent: require_helpers.escapePathComponent,
	unescapePathComponent: require_helpers.unescapePathComponent
};

//#endregion
//# sourceMappingURL=index.cjs.map