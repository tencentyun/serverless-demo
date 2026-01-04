const require_rolldown_runtime = require('../../_virtual/rolldown_runtime.cjs');
const __langchain_core_messages = require_rolldown_runtime.__toESM(require("@langchain/core/messages"));
const __langchain_core_language_models_chat_models = require_rolldown_runtime.__toESM(require("@langchain/core/language_models/chat_models"));
const __langchain_core_runnables = require_rolldown_runtime.__toESM(require("@langchain/core/runnables"));
const __langchain_core_tools = require_rolldown_runtime.__toESM(require("@langchain/core/tools"));
const zod_v3 = require_rolldown_runtime.__toESM(require("zod/v3"));
require("@langchain/langgraph-checkpoint");

//#region src/agents/tests/utils.ts
/**
* Fake chat model for testing tool calling functionality
*/
var FakeToolCallingModel = class FakeToolCallingModel extends __langchain_core_language_models_chat_models.BaseChatModel {
	toolCalls;
	toolStyle;
	indexRef;
	structuredResponse;
	tools = [];
	constructor({ toolCalls = [], toolStyle = "openai", index = 0, structuredResponse, indexRef,...rest } = {}) {
		super(rest);
		this.toolCalls = toolCalls;
		this.toolStyle = toolStyle;
		this.indexRef = indexRef ?? { current: index };
		this.structuredResponse = structuredResponse;
	}
	get index() {
		return this.indexRef.current;
	}
	set index(value) {
		this.indexRef.current = value;
	}
	_llmType() {
		return "fake-tool-calling";
	}
	_combineLLMOutput() {
		return [];
	}
	bindTools(tools) {
		const newInstance = new FakeToolCallingModel({
			toolCalls: this.toolCalls,
			toolStyle: this.toolStyle,
			structuredResponse: this.structuredResponse,
			indexRef: this.indexRef
		});
		newInstance.tools = [...this.tools, ...tools];
		return newInstance;
	}
	withStructuredOutput(_schema) {
		return new __langchain_core_runnables.RunnableLambda({ func: async () => {
			return this.structuredResponse;
		} });
	}
	async _generate(messages, _options, _runManager) {
		const lastMessage = messages[messages.length - 1];
		let content = lastMessage.content;
		if (messages.length > 1) {
			const parts = messages.map((m) => m.content).filter(Boolean);
			content = parts.map((part) => {
				if (typeof part === "string") return part;
				else if (typeof part === "object" && "text" in part) return part.text;
				else if (Array.isArray(part)) return part.map((p) => {
					if (typeof p === "string") return p;
					else if (typeof p === "object" && "text" in p) return p.text;
					return "";
				}).join("-");
				else return JSON.stringify(part);
			}).join("-");
		}
		const isStartOfConversation = messages.length === 1 || messages.length === 2 && messages.every(__langchain_core_messages.HumanMessage.isInstance);
		if (isStartOfConversation && this.index !== 0) this.index = 0;
		const currentToolCalls = this.toolCalls[this.index] || [];
		const messageId = this.index.toString();
		this.index = (this.index + 1) % Math.max(1, this.toolCalls.length);
		const message = new __langchain_core_messages.AIMessage({
			content,
			id: messageId,
			tool_calls: currentToolCalls.length > 0 ? currentToolCalls.map((tc) => ({
				...tc,
				type: "tool_call"
			})) : void 0
		});
		return {
			generations: [{
				text: content,
				message
			}],
			llmOutput: {}
		};
	}
};

//#endregion
exports.FakeToolCallingModel = FakeToolCallingModel;
//# sourceMappingURL=utils.cjs.map