const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_utils_env = require('../utils/env.cjs');
const langsmith = require_rolldown_runtime.__toESM(require("langsmith"));

//#region src/singletons/tracer.ts
let client;
const getDefaultLangChainClientSingleton = () => {
	if (client === void 0) {
		const clientParams = require_utils_env.getEnvironmentVariable("LANGCHAIN_CALLBACKS_BACKGROUND") === "false" ? { blockOnRootRunFinalization: true } : {};
		client = new langsmith.Client(clientParams);
	}
	return client;
};

//#endregion
exports.getDefaultLangChainClientSingleton = getDefaultLangChainClientSingleton;
//# sourceMappingURL=tracer.cjs.map