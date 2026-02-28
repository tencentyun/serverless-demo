import { PatchError, _deepClone, escapePathComponent, unescapePathComponent } from "./src/helpers.js";
import { _areEquals, applyOperation, applyPatch, applyReducer, core_exports, getValueByPointer, validate, validator } from "./src/core.js";
import { compare } from "./src/duplex.js";

//#region src/utils/fast-json-patch/index.ts
/**
* Default export for backwards compat
*/
var fast_json_patch_default = {
	...core_exports,
	JsonPatchError: PatchError,
	deepClone: _deepClone,
	escapePathComponent,
	unescapePathComponent
};

//#endregion
export {  };
//# sourceMappingURL=index.js.map