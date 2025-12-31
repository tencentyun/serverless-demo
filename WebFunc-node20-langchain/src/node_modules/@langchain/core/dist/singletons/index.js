import { __export } from "../_virtual/rolldown_runtime.js";
import { _CONTEXT_VARIABLES_KEY } from "./async_local_storage/globals.js";
import { AsyncLocalStorageProviderSingleton, MockAsyncLocalStorage } from "./async_local_storage/index.js";

//#region src/singletons/index.ts
var singletons_exports = {};
__export(singletons_exports, {
	AsyncLocalStorageProviderSingleton: () => AsyncLocalStorageProviderSingleton,
	MockAsyncLocalStorage: () => MockAsyncLocalStorage,
	_CONTEXT_VARIABLES_KEY: () => _CONTEXT_VARIABLES_KEY
});

//#endregion
export { AsyncLocalStorageProviderSingleton, MockAsyncLocalStorage, _CONTEXT_VARIABLES_KEY, singletons_exports };
//# sourceMappingURL=index.js.map