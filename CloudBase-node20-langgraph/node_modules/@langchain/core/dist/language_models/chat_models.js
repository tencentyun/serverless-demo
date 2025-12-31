import { __export } from "../_virtual/rolldown_runtime.js";
import { convertToOpenAIImageBlock, isBase64ContentBlock, isURLContentBlock } from "../messages/content/data.js";
import { isBaseMessage } from "../messages/base.js";
import { coerceMessageLikeToMessage } from "../messages/utils.js";
import { AIMessage, AIMessageChunk, isAIMessage, isAIMessageChunk } from "../messages/ai.js";
import { getEnvironmentVariable } from "../utils/env.js";
import { callbackHandlerPrefersStreaming } from "../callbacks/base.js";
import { CallbackManager } from "../callbacks/manager.js";
import { concat } from "../utils/stream.js";
import { RUN_KEY } from "../outputs.js";
import { getSchemaDescription, isInteropZodSchema } from "../utils/types/zod.js";
import { toJsonSchema } from "../utils/json_schema.js";
import { RunnableLambda, RunnableSequence } from "../runnables/base.js";
import "../messages/index.js";
import { BaseLanguageModel } from "./base.js";
import { RunnablePassthrough } from "../runnables/passthrough.js";
import { castStandardMessageContent, iife } from "./utils.js";

//#region src/language_models/chat_models.ts
var chat_models_exports = {};
__export(chat_models_exports, {
	BaseChatModel: () => BaseChatModel,
	SimpleChatModel: () => SimpleChatModel
});
function _formatForTracing(messages) {
	const messagesToTrace = [];
	for (const message of messages) {
		let messageToTrace = message;
		if (Array.isArray(message.content)) for (let idx = 0; idx < message.content.length; idx++) {
			const block = message.content[idx];
			if (isURLContentBlock(block) || isBase64ContentBlock(block)) {
				if (messageToTrace === message) messageToTrace = new message.constructor({
					...messageToTrace,
					content: [
						...message.content.slice(0, idx),
						convertToOpenAIImageBlock(block),
						...message.content.slice(idx + 1)
					]
				});
			}
		}
		messagesToTrace.push(messageToTrace);
	}
	return messagesToTrace;
}
/**
* Base class for chat models. It extends the BaseLanguageModel class and
* provides methods for generating chat based on input messages.
*/
var BaseChatModel = class BaseChatModel extends BaseLanguageModel {
	lc_namespace = [
		"langchain",
		"chat_models",
		this._llmType()
	];
	disableStreaming = false;
	outputVersion;
	get callKeys() {
		return [...super.callKeys, "outputVersion"];
	}
	constructor(fields) {
		super(fields);
		this.outputVersion = iife(() => {
			const outputVersion = fields.outputVersion ?? getEnvironmentVariable("LC_OUTPUT_VERSION");
			if (outputVersion && ["v0", "v1"].includes(outputVersion)) return outputVersion;
			return "v0";
		});
	}
	_separateRunnableConfigFromCallOptionsCompat(options) {
		const [runnableConfig, callOptions] = super._separateRunnableConfigFromCallOptions(options);
		callOptions.signal = runnableConfig.signal;
		return [runnableConfig, callOptions];
	}
	/**
	* Invokes the chat model with a single input.
	* @param input The input for the language model.
	* @param options The call options.
	* @returns A Promise that resolves to a BaseMessageChunk.
	*/
	async invoke(input, options) {
		const promptValue = BaseChatModel._convertInputToPromptValue(input);
		const result = await this.generatePrompt([promptValue], options, options?.callbacks);
		const chatGeneration = result.generations[0][0];
		return chatGeneration.message;
	}
	async *_streamResponseChunks(_messages, _options, _runManager) {
		throw new Error("Not implemented.");
	}
	async *_streamIterator(input, options) {
		if (this._streamResponseChunks === BaseChatModel.prototype._streamResponseChunks || this.disableStreaming) yield this.invoke(input, options);
		else {
			const prompt = BaseChatModel._convertInputToPromptValue(input);
			const messages = prompt.toChatMessages();
			const [runnableConfig, callOptions] = this._separateRunnableConfigFromCallOptionsCompat(options);
			const inheritableMetadata = {
				...runnableConfig.metadata,
				...this.getLsParams(callOptions)
			};
			const callbackManager_ = await CallbackManager.configure(runnableConfig.callbacks, this.callbacks, runnableConfig.tags, this.tags, inheritableMetadata, this.metadata, { verbose: this.verbose });
			const extra = {
				options: callOptions,
				invocation_params: this?.invocationParams(callOptions),
				batch_size: 1
			};
			const outputVersion = callOptions.outputVersion ?? this.outputVersion;
			const runManagers = await callbackManager_?.handleChatModelStart(this.toJSON(), [_formatForTracing(messages)], runnableConfig.runId, void 0, extra, void 0, void 0, runnableConfig.runName);
			let generationChunk;
			let llmOutput;
			try {
				for await (const chunk of this._streamResponseChunks(messages, callOptions, runManagers?.[0])) {
					if (chunk.message.id == null) {
						const runId = runManagers?.at(0)?.runId;
						if (runId != null) chunk.message._updateId(`run-${runId}`);
					}
					chunk.message.response_metadata = {
						...chunk.generationInfo,
						...chunk.message.response_metadata
					};
					if (outputVersion === "v1") yield castStandardMessageContent(chunk.message);
					else yield chunk.message;
					if (!generationChunk) generationChunk = chunk;
					else generationChunk = generationChunk.concat(chunk);
					if (isAIMessageChunk(chunk.message) && chunk.message.usage_metadata !== void 0) llmOutput = { tokenUsage: {
						promptTokens: chunk.message.usage_metadata.input_tokens,
						completionTokens: chunk.message.usage_metadata.output_tokens,
						totalTokens: chunk.message.usage_metadata.total_tokens
					} };
				}
			} catch (err) {
				await Promise.all((runManagers ?? []).map((runManager) => runManager?.handleLLMError(err)));
				throw err;
			}
			await Promise.all((runManagers ?? []).map((runManager) => runManager?.handleLLMEnd({
				generations: [[generationChunk]],
				llmOutput
			})));
		}
	}
	getLsParams(options) {
		const providerName = this.getName().startsWith("Chat") ? this.getName().replace("Chat", "") : this.getName();
		return {
			ls_model_type: "chat",
			ls_stop: options.stop,
			ls_provider: providerName
		};
	}
	/** @ignore */
	async _generateUncached(messages, parsedOptions, handledOptions, startedRunManagers) {
		const baseMessages = messages.map((messageList) => messageList.map(coerceMessageLikeToMessage));
		let runManagers;
		if (startedRunManagers !== void 0 && startedRunManagers.length === baseMessages.length) runManagers = startedRunManagers;
		else {
			const inheritableMetadata = {
				...handledOptions.metadata,
				...this.getLsParams(parsedOptions)
			};
			const callbackManager_ = await CallbackManager.configure(handledOptions.callbacks, this.callbacks, handledOptions.tags, this.tags, inheritableMetadata, this.metadata, { verbose: this.verbose });
			const extra = {
				options: parsedOptions,
				invocation_params: this?.invocationParams(parsedOptions),
				batch_size: 1
			};
			runManagers = await callbackManager_?.handleChatModelStart(this.toJSON(), baseMessages.map(_formatForTracing), handledOptions.runId, void 0, extra, void 0, void 0, handledOptions.runName);
		}
		const outputVersion = parsedOptions.outputVersion ?? this.outputVersion;
		const generations = [];
		const llmOutputs = [];
		const hasStreamingHandler = !!runManagers?.[0].handlers.find(callbackHandlerPrefersStreaming);
		if (hasStreamingHandler && !this.disableStreaming && baseMessages.length === 1 && this._streamResponseChunks !== BaseChatModel.prototype._streamResponseChunks) try {
			const stream = await this._streamResponseChunks(baseMessages[0], parsedOptions, runManagers?.[0]);
			let aggregated;
			let llmOutput;
			for await (const chunk of stream) {
				if (chunk.message.id == null) {
					const runId = runManagers?.at(0)?.runId;
					if (runId != null) chunk.message._updateId(`run-${runId}`);
				}
				if (aggregated === void 0) aggregated = chunk;
				else aggregated = concat(aggregated, chunk);
				if (isAIMessageChunk(chunk.message) && chunk.message.usage_metadata !== void 0) llmOutput = { tokenUsage: {
					promptTokens: chunk.message.usage_metadata.input_tokens,
					completionTokens: chunk.message.usage_metadata.output_tokens,
					totalTokens: chunk.message.usage_metadata.total_tokens
				} };
			}
			if (aggregated === void 0) throw new Error("Received empty response from chat model call.");
			generations.push([aggregated]);
			await runManagers?.[0].handleLLMEnd({
				generations,
				llmOutput
			});
		} catch (e) {
			await runManagers?.[0].handleLLMError(e);
			throw e;
		}
		else {
			const results = await Promise.allSettled(baseMessages.map(async (messageList, i) => {
				const generateResults = await this._generate(messageList, {
					...parsedOptions,
					promptIndex: i
				}, runManagers?.[i]);
				if (outputVersion === "v1") for (const generation of generateResults.generations) generation.message = castStandardMessageContent(generation.message);
				return generateResults;
			}));
			await Promise.all(results.map(async (pResult, i) => {
				if (pResult.status === "fulfilled") {
					const result = pResult.value;
					for (const generation of result.generations) {
						if (generation.message.id == null) {
							const runId = runManagers?.at(0)?.runId;
							if (runId != null) generation.message._updateId(`run-${runId}`);
						}
						generation.message.response_metadata = {
							...generation.generationInfo,
							...generation.message.response_metadata
						};
					}
					if (result.generations.length === 1) result.generations[0].message.response_metadata = {
						...result.llmOutput,
						...result.generations[0].message.response_metadata
					};
					generations[i] = result.generations;
					llmOutputs[i] = result.llmOutput;
					return runManagers?.[i]?.handleLLMEnd({
						generations: [result.generations],
						llmOutput: result.llmOutput
					});
				} else {
					await runManagers?.[i]?.handleLLMError(pResult.reason);
					return Promise.reject(pResult.reason);
				}
			}));
		}
		const output = {
			generations,
			llmOutput: llmOutputs.length ? this._combineLLMOutput?.(...llmOutputs) : void 0
		};
		Object.defineProperty(output, RUN_KEY, {
			value: runManagers ? { runIds: runManagers?.map((manager) => manager.runId) } : void 0,
			configurable: true
		});
		return output;
	}
	async _generateCached({ messages, cache, llmStringKey, parsedOptions, handledOptions }) {
		const baseMessages = messages.map((messageList) => messageList.map(coerceMessageLikeToMessage));
		const inheritableMetadata = {
			...handledOptions.metadata,
			...this.getLsParams(parsedOptions)
		};
		const callbackManager_ = await CallbackManager.configure(handledOptions.callbacks, this.callbacks, handledOptions.tags, this.tags, inheritableMetadata, this.metadata, { verbose: this.verbose });
		const extra = {
			options: parsedOptions,
			invocation_params: this?.invocationParams(parsedOptions),
			batch_size: 1
		};
		const runManagers = await callbackManager_?.handleChatModelStart(this.toJSON(), baseMessages.map(_formatForTracing), handledOptions.runId, void 0, extra, void 0, void 0, handledOptions.runName);
		const missingPromptIndices = [];
		const results = await Promise.allSettled(baseMessages.map(async (baseMessage, index) => {
			const prompt = BaseChatModel._convertInputToPromptValue(baseMessage).toString();
			const result = await cache.lookup(prompt, llmStringKey);
			if (result == null) missingPromptIndices.push(index);
			return result;
		}));
		const cachedResults = results.map((result, index) => ({
			result,
			runManager: runManagers?.[index]
		})).filter(({ result }) => result.status === "fulfilled" && result.value != null || result.status === "rejected");
		const outputVersion = parsedOptions.outputVersion ?? this.outputVersion;
		const generations = [];
		await Promise.all(cachedResults.map(async ({ result: promiseResult, runManager }, i) => {
			if (promiseResult.status === "fulfilled") {
				const result = promiseResult.value;
				generations[i] = result.map((result$1) => {
					if ("message" in result$1 && isBaseMessage(result$1.message) && isAIMessage(result$1.message)) {
						result$1.message.usage_metadata = {
							input_tokens: 0,
							output_tokens: 0,
							total_tokens: 0
						};
						if (outputVersion === "v1") result$1.message = castStandardMessageContent(result$1.message);
					}
					result$1.generationInfo = {
						...result$1.generationInfo,
						tokenUsage: {}
					};
					return result$1;
				});
				if (result.length) await runManager?.handleLLMNewToken(result[0].text);
				return runManager?.handleLLMEnd({ generations: [result] }, void 0, void 0, void 0, { cached: true });
			} else {
				await runManager?.handleLLMError(promiseResult.reason, void 0, void 0, void 0, { cached: true });
				return Promise.reject(promiseResult.reason);
			}
		}));
		const output = {
			generations,
			missingPromptIndices,
			startedRunManagers: runManagers
		};
		Object.defineProperty(output, RUN_KEY, {
			value: runManagers ? { runIds: runManagers?.map((manager) => manager.runId) } : void 0,
			configurable: true
		});
		return output;
	}
	/**
	* Generates chat based on the input messages.
	* @param messages An array of arrays of BaseMessage instances.
	* @param options The call options or an array of stop sequences.
	* @param callbacks The callbacks for the language model.
	* @returns A Promise that resolves to an LLMResult.
	*/
	async generate(messages, options, callbacks) {
		let parsedOptions;
		if (Array.isArray(options)) parsedOptions = { stop: options };
		else parsedOptions = options;
		const baseMessages = messages.map((messageList) => messageList.map(coerceMessageLikeToMessage));
		const [runnableConfig, callOptions] = this._separateRunnableConfigFromCallOptionsCompat(parsedOptions);
		runnableConfig.callbacks = runnableConfig.callbacks ?? callbacks;
		if (!this.cache) return this._generateUncached(baseMessages, callOptions, runnableConfig);
		const { cache } = this;
		const llmStringKey = this._getSerializedCacheKeyParametersForCall(callOptions);
		const { generations, missingPromptIndices, startedRunManagers } = await this._generateCached({
			messages: baseMessages,
			cache,
			llmStringKey,
			parsedOptions: callOptions,
			handledOptions: runnableConfig
		});
		let llmOutput = {};
		if (missingPromptIndices.length > 0) {
			const results = await this._generateUncached(missingPromptIndices.map((i) => baseMessages[i]), callOptions, runnableConfig, startedRunManagers !== void 0 ? missingPromptIndices.map((i) => startedRunManagers?.[i]) : void 0);
			await Promise.all(results.generations.map(async (generation, index) => {
				const promptIndex = missingPromptIndices[index];
				generations[promptIndex] = generation;
				const prompt = BaseChatModel._convertInputToPromptValue(baseMessages[promptIndex]).toString();
				return cache.update(prompt, llmStringKey, generation);
			}));
			llmOutput = results.llmOutput ?? {};
		}
		return {
			generations,
			llmOutput
		};
	}
	/**
	* Get the parameters used to invoke the model
	*/
	invocationParams(_options) {
		return {};
	}
	_modelType() {
		return "base_chat_model";
	}
	/**
	* Generates a prompt based on the input prompt values.
	* @param promptValues An array of BasePromptValue instances.
	* @param options The call options or an array of stop sequences.
	* @param callbacks The callbacks for the language model.
	* @returns A Promise that resolves to an LLMResult.
	*/
	async generatePrompt(promptValues, options, callbacks) {
		const promptMessages = promptValues.map((promptValue) => promptValue.toChatMessages());
		return this.generate(promptMessages, options, callbacks);
	}
	withStructuredOutput(outputSchema, config) {
		if (typeof this.bindTools !== "function") throw new Error(`Chat model must implement ".bindTools()" to use withStructuredOutput.`);
		if (config?.strict) throw new Error(`"strict" mode is not supported for this model by default.`);
		const schema = outputSchema;
		const name = config?.name;
		const description = getSchemaDescription(schema) ?? "A function available to call.";
		const method = config?.method;
		const includeRaw = config?.includeRaw;
		if (method === "jsonMode") throw new Error(`Base withStructuredOutput implementation only supports "functionCalling" as a method.`);
		let functionName = name ?? "extract";
		let tools;
		if (isInteropZodSchema(schema)) tools = [{
			type: "function",
			function: {
				name: functionName,
				description,
				parameters: toJsonSchema(schema)
			}
		}];
		else {
			if ("name" in schema) functionName = schema.name;
			tools = [{
				type: "function",
				function: {
					name: functionName,
					description,
					parameters: schema
				}
			}];
		}
		const llm = this.bindTools(tools);
		const outputParser = RunnableLambda.from((input) => {
			if (!AIMessageChunk.isInstance(input)) throw new Error("Input is not an AIMessageChunk.");
			if (!input.tool_calls || input.tool_calls.length === 0) throw new Error("No tool calls found in the response.");
			const toolCall = input.tool_calls.find((tc) => tc.name === functionName);
			if (!toolCall) throw new Error(`No tool call found with name ${functionName}.`);
			return toolCall.args;
		});
		if (!includeRaw) return llm.pipe(outputParser).withConfig({ runName: "StructuredOutput" });
		const parserAssign = RunnablePassthrough.assign({ parsed: (input, config$1) => outputParser.invoke(input.raw, config$1) });
		const parserNone = RunnablePassthrough.assign({ parsed: () => null });
		const parsedWithFallback = parserAssign.withFallbacks({ fallbacks: [parserNone] });
		return RunnableSequence.from([{ raw: llm }, parsedWithFallback]).withConfig({ runName: "StructuredOutputRunnable" });
	}
};
/**
* An abstract class that extends BaseChatModel and provides a simple
* implementation of _generate.
*/
var SimpleChatModel = class extends BaseChatModel {
	async _generate(messages, options, runManager) {
		const text = await this._call(messages, options, runManager);
		const message = new AIMessage(text);
		if (typeof message.content !== "string") throw new Error("Cannot generate with a simple chat model when output is not a string.");
		return { generations: [{
			text: message.content,
			message
		}] };
	}
};

//#endregion
export { BaseChatModel, SimpleChatModel, chat_models_exports };
//# sourceMappingURL=chat_models.js.map