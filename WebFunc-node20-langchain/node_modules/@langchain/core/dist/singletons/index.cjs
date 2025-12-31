const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_globals = require('./async_local_storage/globals.cjs');
const require_index = require('./async_local_storage/index.cjs');

//#region src/singletons/index.ts
var singletons_exports = {};
require_rolldown_runtime.__export(singletons_exports, {
	AsyncLocalStorageProviderSingleton: () => require_index.AsyncLocalStorageProviderSingleton,
	MockAsyncLocalStorage: () => require_index.MockAsyncLocalStorage,
	_CONTEXT_VARIABLES_KEY: () => require_globals._CONTEXT_VARIABLES_KEY
});

//#endregion
exports.AsyncLocalStorageProviderSingleton = require_index.AsyncLocalStorageProviderSingleton;
exports.MockAsyncLocalStorage = require_index.MockAsyncLocalStorage;
exports._CONTEXT_VARIABLES_KEY = require_globals._CONTEXT_VARIABLES_KEY;
Object.defineProperty(exports, 'singletons_exports', {
  enumerable: true,
  get: function () {
    return singletons_exports;
  }
});
//# sourceMappingURL=index.cjs.map