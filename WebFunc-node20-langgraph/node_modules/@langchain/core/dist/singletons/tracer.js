import { getEnvironmentVariable } from "../utils/env.js";
import { Client } from "langsmith";

//#region src/singletons/tracer.ts
let client;
const getDefaultLangChainClientSingleton = () => {
	if (client === void 0) {
		const clientParams = getEnvironmentVariable("LANGCHAIN_CALLBACKS_BACKGROUND") === "false" ? { blockOnRootRunFinalization: true } : {};
		client = new Client(clientParams);
	}
	return client;
};

//#endregion
export { getDefaultLangChainClientSingleton };
//# sourceMappingURL=tracer.js.map