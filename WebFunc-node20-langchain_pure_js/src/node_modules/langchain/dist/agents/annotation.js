import { MessagesZodState } from "@langchain/langgraph";
import { z } from "zod/v3";
import { withLangGraph } from "@langchain/langgraph/zod";
import { getInteropZodObjectShape, isZodSchemaV4 } from "@langchain/core/utils/types";

//#region src/agents/annotation.ts
function createAgentAnnotationConditional(hasStructuredResponse = true, stateSchema, middlewareList = []) {
	/**
	* Create Zod schema object to preserve jsonSchemaExtra
	* metadata for LangGraph Studio using v3-compatible withLangGraph
	*/
	const schemaShape = { jumpTo: z.union([
		z.literal("model_request"),
		z.literal("tools"),
		z.literal("end"),
		z.undefined()
	]).optional() };
	const applySchema = (schema) => {
		const shape = isZodSchemaV4(schema) ? getInteropZodObjectShape(schema) : schema.shape;
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
			schemaShape[key] = isZodSchemaV4(fieldSchema) ? z.any() : fieldSchema;
		}
	};
	/**
	* Add state schema properties to the Zod schema
	*/
	if (stateSchema && ("shape" in stateSchema || isZodSchemaV4(stateSchema))) applySchema(stateSchema);
	for (const middleware of middlewareList) if (middleware.stateSchema) applySchema(middleware.stateSchema);
	if (hasStructuredResponse) schemaShape.structuredResponse = z.string().optional();
	const messages = withLangGraph(z.custom(), { jsonSchemaExtra: { langgraph_type: "messages" } });
	return {
		state: MessagesZodState.extend(schemaShape),
		input: z.object({
			messages,
			...Object.fromEntries(Object.entries(schemaShape).filter(([key]) => !["structuredResponse", "jumpTo"].includes(key)))
		}),
		output: z.object({
			messages,
			...Object.fromEntries(Object.entries(schemaShape).filter(([key]) => key !== "jumpTo"))
		})
	};
}

//#endregion
export { createAgentAnnotationConditional };
//# sourceMappingURL=annotation.js.map