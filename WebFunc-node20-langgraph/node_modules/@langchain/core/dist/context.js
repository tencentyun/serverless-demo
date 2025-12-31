import { getContextVariable, registerConfigureHook, setContextVariable } from "./singletons/async_local_storage/context.js";
import { AsyncLocalStorageProviderSingleton } from "./singletons/async_local_storage/index.js";
import "./singletons/index.js";
import { AsyncLocalStorage } from "node:async_hooks";

//#region src/context.ts
AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new AsyncLocalStorage());
const foo = "bar";

//#endregion
export { foo, getContextVariable, registerConfigureHook, setContextVariable };
//# sourceMappingURL=context.js.map