const require_rolldown_runtime = require('./_virtual/rolldown_runtime.cjs');
const require_context = require('./singletons/async_local_storage/context.cjs');
const require_index = require('./singletons/async_local_storage/index.cjs');
require('./singletons/index.cjs');
const node_async_hooks = require_rolldown_runtime.__toESM(require("node:async_hooks"));

//#region src/context.ts
require_index.AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new node_async_hooks.AsyncLocalStorage());
const foo = "bar";

//#endregion
exports.foo = foo;
exports.getContextVariable = require_context.getContextVariable;
exports.registerConfigureHook = require_context.registerConfigureHook;
exports.setContextVariable = require_context.setContextVariable;
//# sourceMappingURL=context.cjs.map