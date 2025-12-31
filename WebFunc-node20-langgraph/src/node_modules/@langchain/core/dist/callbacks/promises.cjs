const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_callbacks = require('../singletons/callbacks.cjs');

//#region src/callbacks/promises.ts
var promises_exports = {};
require_rolldown_runtime.__export(promises_exports, {
	awaitAllCallbacks: () => require_callbacks.awaitAllCallbacks,
	consumeCallback: () => require_callbacks.consumeCallback
});

//#endregion
exports.awaitAllCallbacks = require_callbacks.awaitAllCallbacks;
exports.consumeCallback = require_callbacks.consumeCallback;
Object.defineProperty(exports, 'promises_exports', {
  enumerable: true,
  get: function () {
    return promises_exports;
  }
});
//# sourceMappingURL=promises.cjs.map