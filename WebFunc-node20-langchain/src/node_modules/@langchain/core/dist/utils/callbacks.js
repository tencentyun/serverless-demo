import { getEnvironmentVariable } from "./env.js";

//#region src/utils/callbacks.ts
const isTracingEnabled = (tracingEnabled) => {
	if (tracingEnabled !== void 0) return tracingEnabled;
	const envVars = [
		"LANGSMITH_TRACING_V2",
		"LANGCHAIN_TRACING_V2",
		"LANGSMITH_TRACING",
		"LANGCHAIN_TRACING"
	];
	return !!envVars.find((envVar) => getEnvironmentVariable(envVar) === "true");
};

//#endregion
export { isTracingEnabled };
//# sourceMappingURL=callbacks.js.map