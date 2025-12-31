import { END } from "@langchain/langgraph";
import { z } from "zod/v3";
import { interopSafeParseAsync, interopZodObjectMakeFieldsOptional } from "@langchain/core/utils/types";

//#region src/agents/nodes/utils.ts
/**
* Helper function to initialize middleware state defaults.
* This is used to ensure all middleware state properties are initialized.
*
* Private properties (starting with _) are automatically made optional since
* users cannot provide them when invoking the agent.
*/
async function initializeMiddlewareStates(middlewareList, state) {
	const middlewareStates = {};
	for (const middleware of middlewareList) {
		/**
		* skip middleware if it doesn't have a state schema
		*/
		if (!middleware.stateSchema) continue;
		const modifiedSchema = interopZodObjectMakeFieldsOptional(middleware.stateSchema, (key) => key.startsWith("_"));
		const parseResult = await interopSafeParseAsync(modifiedSchema, state);
		if (parseResult.success) {
			Object.assign(middlewareStates, parseResult.data);
			continue;
		}
		/**
		* If safeParse fails, there are required public fields missing
		*/
		const requiredFields = parseResult.error.issues.filter((issue) => issue.code === "invalid_type" && issue.message === "Required").map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`).join("\n");
		throw new Error(`Middleware "${middleware.name}" has required state fields that must be initialized:\n${requiredFields}\n\nTo fix this, either:\n1. Provide default values in your middleware's state schema using .default():\n   stateSchema: z.object({\n     myField: z.string().default("default value")\n   })\n\n2. Or make the fields optional using .optional():\n   stateSchema: z.object({\n     myField: z.string().optional()\n   })\n\n3. Or ensure you pass these values when invoking the agent:\n   agent.invoke({\n     messages: [...],\n     ${parseResult.error.issues[0]?.path.join(".")}: "value"\n   })`);
	}
	return middlewareStates;
}
/**
* Users can define private and public state for a middleware. Private state properties start with an underscore.
* This function will return the private state properties from the state schema, making all of them optional.
* @param stateSchema - The middleware state schema
* @returns A new schema containing only the private properties (underscore-prefixed), all made optional
*/
function derivePrivateState(stateSchema) {
	const builtInStateSchema = {
		messages: z.custom(() => []),
		structuredResponse: z.any().optional()
	};
	if (!stateSchema) return z.object(builtInStateSchema);
	const { shape } = stateSchema;
	const privateShape = { ...builtInStateSchema };
	for (const [key, value] of Object.entries(shape)) if (key.startsWith("_")) privateShape[key] = value.optional();
	else privateShape[key] = value;
	return z.object(privateShape);
}
function parseJumpToTarget(target) {
	if (!target) return void 0;
	/**
	* if target is already a valid jump target, return it
	*/
	if ([
		"model_request",
		"tools",
		END
	].includes(target)) return target;
	if (target === "model") return "model_request";
	if (target === "tools") return "tools";
	if (target === "end") return END;
	throw new Error(`Invalid jump target: ${target}, must be "model", "tools" or "end".`);
}
/**
* `config` always contains a signal from LangGraphs Pregel class.
* To ensure we acknowledge the abort signal from the user, we merge it
* with the signal from the ToolNode.
*
* @param signals - The signals to merge.
* @returns The merged signal.
*/
function mergeAbortSignals(...signals) {
	return AbortSignal.any(signals.filter((maybeSignal) => maybeSignal !== null && maybeSignal !== void 0 && typeof maybeSignal === "object" && "aborted" in maybeSignal && typeof maybeSignal.aborted === "boolean"));
}

//#endregion
export { derivePrivateState, initializeMiddlewareStates, mergeAbortSignals, parseJumpToTarget };
//# sourceMappingURL=utils.js.map