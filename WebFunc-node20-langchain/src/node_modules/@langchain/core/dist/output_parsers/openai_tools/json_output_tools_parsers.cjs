const require_json = require('../../utils/json.cjs');
const require_ai = require('../../messages/ai.cjs');
const require_zod = require('../../utils/types/zod.cjs');
const require_base = require('../base.cjs');
const require_transform = require('../transform.cjs');
require('../json.cjs');

//#region src/output_parsers/openai_tools/json_output_tools_parsers.ts
function parseToolCall(rawToolCall, options) {
	if (rawToolCall.function === void 0) return void 0;
	let functionArgs;
	if (options?.partial) try {
		functionArgs = require_json.parsePartialJson(rawToolCall.function.arguments ?? "{}");
	} catch {
		return void 0;
	}
	else try {
		functionArgs = JSON.parse(rawToolCall.function.arguments);
	} catch (e) {
		throw new require_base.OutputParserException([
			`Function "${rawToolCall.function.name}" arguments:`,
			``,
			rawToolCall.function.arguments,
			``,
			`are not valid JSON.`,
			`Error: ${e.message}`
		].join("\n"));
	}
	const parsedToolCall = {
		name: rawToolCall.function.name,
		args: functionArgs,
		type: "tool_call"
	};
	if (options?.returnId) parsedToolCall.id = rawToolCall.id;
	return parsedToolCall;
}
function convertLangChainToolCallToOpenAI(toolCall) {
	if (toolCall.id === void 0) throw new Error(`All OpenAI tool calls must have an "id" field.`);
	return {
		id: toolCall.id,
		type: "function",
		function: {
			name: toolCall.name,
			arguments: JSON.stringify(toolCall.args)
		}
	};
}
function makeInvalidToolCall(rawToolCall, errorMsg) {
	return {
		name: rawToolCall.function?.name,
		args: rawToolCall.function?.arguments,
		id: rawToolCall.id,
		error: errorMsg,
		type: "invalid_tool_call"
	};
}
/**
* Class for parsing the output of a tool-calling LLM into a JSON object.
*/
var JsonOutputToolsParser = class extends require_transform.BaseCumulativeTransformOutputParser {
	static lc_name() {
		return "JsonOutputToolsParser";
	}
	returnId = false;
	lc_namespace = [
		"langchain",
		"output_parsers",
		"openai_tools"
	];
	lc_serializable = true;
	constructor(fields) {
		super(fields);
		this.returnId = fields?.returnId ?? this.returnId;
	}
	_diff() {
		throw new Error("Not supported.");
	}
	async parse() {
		throw new Error("Not implemented.");
	}
	async parseResult(generations) {
		const result = await this.parsePartialResult(generations, false);
		return result;
	}
	/**
	* Parses the output and returns a JSON object. If `argsOnly` is true,
	* only the arguments of the function call are returned.
	* @param generations The output of the LLM to parse.
	* @returns A JSON object representation of the function call or its arguments.
	*/
	async parsePartialResult(generations, partial = true) {
		const message = generations[0].message;
		let toolCalls;
		if (require_ai.isAIMessage(message) && message.tool_calls?.length) toolCalls = message.tool_calls.map((toolCall) => {
			const { id,...rest } = toolCall;
			if (!this.returnId) return rest;
			return {
				id,
				...rest
			};
		});
		else if (message.additional_kwargs.tool_calls !== void 0) {
			const rawToolCalls = JSON.parse(JSON.stringify(message.additional_kwargs.tool_calls));
			toolCalls = rawToolCalls.map((rawToolCall) => {
				return parseToolCall(rawToolCall, {
					returnId: this.returnId,
					partial
				});
			});
		}
		if (!toolCalls) return [];
		const parsedToolCalls = [];
		for (const toolCall of toolCalls) if (toolCall !== void 0) {
			const backwardsCompatibleToolCall = {
				type: toolCall.name,
				args: toolCall.args,
				id: toolCall.id
			};
			parsedToolCalls.push(backwardsCompatibleToolCall);
		}
		return parsedToolCalls;
	}
};
/**
* Class for parsing the output of a tool-calling LLM into a JSON object if you are
* expecting only a single tool to be called.
*/
var JsonOutputKeyToolsParser = class extends JsonOutputToolsParser {
	static lc_name() {
		return "JsonOutputKeyToolsParser";
	}
	lc_namespace = [
		"langchain",
		"output_parsers",
		"openai_tools"
	];
	lc_serializable = true;
	returnId = false;
	/** The type of tool calls to return. */
	keyName;
	/** Whether to return only the first tool call. */
	returnSingle = false;
	zodSchema;
	constructor(params) {
		super(params);
		this.keyName = params.keyName;
		this.returnSingle = params.returnSingle ?? this.returnSingle;
		this.zodSchema = params.zodSchema;
	}
	async _validateResult(result) {
		if (this.zodSchema === void 0) return result;
		const zodParsedResult = await require_zod.interopSafeParseAsync(this.zodSchema, result);
		if (zodParsedResult.success) return zodParsedResult.data;
		else throw new require_base.OutputParserException(`Failed to parse. Text: "${JSON.stringify(result, null, 2)}". Error: ${JSON.stringify(zodParsedResult.error?.issues)}`, JSON.stringify(result, null, 2));
	}
	async parsePartialResult(generations) {
		const results = await super.parsePartialResult(generations);
		const matchingResults = results.filter((result) => result.type === this.keyName);
		let returnedValues = matchingResults;
		if (!matchingResults.length) return void 0;
		if (!this.returnId) returnedValues = matchingResults.map((result) => result.args);
		if (this.returnSingle) return returnedValues[0];
		return returnedValues;
	}
	async parseResult(generations) {
		const results = await super.parsePartialResult(generations, false);
		const matchingResults = results.filter((result) => result.type === this.keyName);
		let returnedValues = matchingResults;
		if (!matchingResults.length) return void 0;
		if (!this.returnId) returnedValues = matchingResults.map((result) => result.args);
		if (this.returnSingle) return this._validateResult(returnedValues[0]);
		const toolCallResults = await Promise.all(returnedValues.map((value) => this._validateResult(value)));
		return toolCallResults;
	}
};

//#endregion
exports.JsonOutputKeyToolsParser = JsonOutputKeyToolsParser;
exports.JsonOutputToolsParser = JsonOutputToolsParser;
exports.convertLangChainToolCallToOpenAI = convertLangChainToolCallToOpenAI;
exports.makeInvalidToolCall = makeInvalidToolCall;
exports.parseToolCall = parseToolCall;
//# sourceMappingURL=json_output_tools_parsers.cjs.map