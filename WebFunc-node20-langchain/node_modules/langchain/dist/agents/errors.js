//#region src/agents/errors.ts
var MultipleToolsBoundError = class extends Error {
	constructor() {
		super("The provided LLM already has bound tools. Please provide an LLM without bound tools to createAgent. The agent will bind the tools provided in the 'tools' parameter.");
	}
};
/**
* Raised when model returns multiple structured output tool calls when only one is expected.
*/
var MultipleStructuredOutputsError = class extends Error {
	toolNames;
	constructor(toolNames) {
		super(`The model has called multiple tools: ${toolNames.join(", ")} to return a structured output. This is not supported. Please provide a single structured output.`);
		this.toolNames = toolNames;
	}
};
/**
* Raised when structured output tool call arguments fail to parse according to the schema.
*/
var StructuredOutputParsingError = class extends Error {
	toolName;
	errors;
	constructor(toolName, errors) {
		super(`Failed to parse structured output for tool '${toolName}':${errors.map((e) => `\n  - ${e}`).join("")}.`);
		this.toolName = toolName;
		this.errors = errors;
	}
};
/**
* Raised when a tool call is throwing an error.
*/
var ToolInvocationError = class extends Error {
	toolCall;
	toolError;
	constructor(toolError, toolCall) {
		const error = toolError instanceof Error ? toolError : new Error(String(toolError));
		const toolArgs = JSON.stringify(toolCall.args);
		super(`Error invoking tool '${toolCall.name}' with kwargs ${toolArgs} with error: ${error.stack}\n Please fix the error and try again.`);
		this.toolCall = toolCall;
		this.toolError = error;
	}
};

//#endregion
export { MultipleStructuredOutputsError, MultipleToolsBoundError, StructuredOutputParsingError, ToolInvocationError };
//# sourceMappingURL=errors.js.map