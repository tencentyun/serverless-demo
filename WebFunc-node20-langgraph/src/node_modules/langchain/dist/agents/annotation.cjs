const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const __langchain_langgraph = require_rolldown_runtime.__toESM(require("@langchain/langgraph"));
const zod_v3 = require_rolldown_runtime.__toESM(require("zod/v3"));
const __langchain_langgraph_zod = require_rolldown_runtime.__toESM(require("@langchain/langgraph/zod"));
const __langchain_core_utils_types = require_rolldown_runtime.__toESM(require("@langchain/core/utils/types"));

//#region src/agents/annotation.ts
function createAgentAnnotationConditional(hasStructuredResponse = true, stateSchema, middlewareList = []) {
	/**
	* Create Zod schema object to preserve jsonSchemaExtra
	* metadata for LangGraph Studio using v3-compatible withLangGraph
	*/
	const schemaShape = { jumpTo: zod_v3.z.union([
		zod_v3.z.literal("model_request"),
		zod_v3.z.literal("tools"),
		zod_v3.z.literal("end"),
		zod_v3.z.undefined()
	]).optional() };
	const applySchema = (schema) => {
		const shape = (0, __langchain_core_utils_types.isZodSchemaV4)(schema) ? (0, __langchain_core_utils_types.getInteropZodObjectShape)(schema) : schema.shape;
		for (const [key, fieldSchema] of Object.entries(shape)) {
			/**
			* Skip private state properties
			*/
			if (key.startsWith("_")) continue;
			if (!(key in schemaShape))
 /**
			* If the field schema is Zod v4, convert to v3-compatible z.any()
			* This allows the shape to be merged while preserving the key structure
			*/
			schemaShape[key] = (0, __langchain_core_utils_types.isZodSchemaV4)(fieldSchema) ? zod_v3.z.any() : fieldSchema;
		}
	};
	/**
	* Add state schema properties to the Zod schema
	*/
	if (stateSchema && ("shape" in stateSchema || (0, __langchain_core_utils_types.isZodSchemaV4)(stateSchema))) applySchema(stateSchema);
	for (const middleware of middlewareList) if (middleware.stateSchema) applySchema(middleware.stateSchema);
	if (hasStructuredResponse) schemaShape.structuredResponse = zod_v3.z.string().optional();
	const messages = (0, __langchain_langgraph_zod.withLangGraph)(zod_v3.z.custom(), { jsonSchemaExtra: { langgraph_type: "messages" } });
	return {
		state: __langchain_langgraph.MessagesZodState.extend(schemaShape),
		input: zod_v3.z.object({
			messages,
			...Object.fromEntries(Object.entries(schemaShape).filter(([key]) => !["structuredResponse", "jumpTo"].includes(key)))
		}),
		output: zod_v3.z.object({
			messages,
			...Object.fromEntries(Object.entries(schemaShape).filter(([key]) => key !== "jumpTo"))
		})
	};
}

//#endregion
exports.createAgentAnnotationConditional = createAgentAnnotationConditional;
//# sourceMappingURL=annotation.cjs.map