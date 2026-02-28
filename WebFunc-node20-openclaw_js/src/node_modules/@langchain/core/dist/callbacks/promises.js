import { __export } from "../_virtual/rolldown_runtime.js";
import { awaitAllCallbacks, consumeCallback } from "../singletons/callbacks.js";

//#region src/callbacks/promises.ts
var promises_exports = {};
__export(promises_exports, {
	awaitAllCallbacks: () => awaitAllCallbacks,
	consumeCallback: () => consumeCallback
});

//#endregion
export { awaitAllCallbacks, consumeCallback, promises_exports };
//# sourceMappingURL=promises.js.map