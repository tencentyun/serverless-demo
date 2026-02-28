import { __export } from "../_virtual/rolldown_runtime.js";
import { applyPatch } from "./fast-json-patch/src/core.js";
import { compare } from "./fast-json-patch/src/duplex.js";
import "./fast-json-patch/index.js";

//#region src/utils/json_patch.ts
var json_patch_exports = {};
__export(json_patch_exports, {
	applyPatch: () => applyPatch,
	compare: () => compare
});

//#endregion
export { applyPatch, compare, json_patch_exports };
//# sourceMappingURL=json_patch.js.map