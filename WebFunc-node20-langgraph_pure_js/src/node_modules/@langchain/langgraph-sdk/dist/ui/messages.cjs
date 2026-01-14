const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
let _langchain_core_messages = require("@langchain/core/messages");

//#region src/ui/messages.ts
function tryConvertToChunk(message) {
	try {
		if ((0, _langchain_core_messages.isBaseMessageChunk)(message)) return message;
		return (0, _langchain_core_messages.convertToChunk)(message);
	} catch {
		return null;
	}
}
function tryCoerceMessageLikeToMessage(message) {
	if (message.type === "human" || message.type === "user") return new _langchain_core_messages.HumanMessageChunk(message);
	if (message.type === "ai" || message.type === "assistant") return new _langchain_core_messages.AIMessageChunk(message);
	if (message.type === "system") return new _langchain_core_messages.SystemMessageChunk(message);
	if (message.type === "tool" && "tool_call_id" in message) return new _langchain_core_messages.ToolMessageChunk({
		...message,
		tool_call_id: message.tool_call_id
	});
	if (message.type === "remove" && message.id != null) return new _langchain_core_messages.RemoveMessage({
		...message,
		id: message.id
	});
	return (0, _langchain_core_messages.coerceMessageLikeToMessage)(message);
}
var MessageTupleManager = class {
	chunks = {};
	constructor() {
		this.chunks = {};
	}
	add(serialized, metadata) {
		if (serialized.type.endsWith("MessageChunk")) serialized.type = serialized.type.slice(0, -12).toLowerCase();
		const message = tryCoerceMessageLikeToMessage(serialized);
		const chunk = tryConvertToChunk(message);
		const { id } = chunk ?? message;
		if (!id) {
			console.warn("No message ID found for chunk, ignoring in state", serialized);
			return null;
		}
		this.chunks[id] ??= {};
		this.chunks[id].metadata = metadata ?? this.chunks[id].metadata;
		if (chunk) {
			const prev = this.chunks[id].chunk;
			this.chunks[id].chunk = ((0, _langchain_core_messages.isBaseMessageChunk)(prev) ? prev : null)?.concat(chunk) ?? chunk;
		} else this.chunks[id].chunk = message;
		return id;
	}
	clear() {
		this.chunks = {};
	}
	get(id, defaultIndex) {
		if (id == null) return null;
		if (this.chunks[id] == null) return null;
		if (defaultIndex != null) this.chunks[id].index ??= defaultIndex;
		return this.chunks[id];
	}
};
const toMessageDict = (chunk) => {
	const { type, data } = chunk.toDict();
	return {
		...data,
		type
	};
};

//#endregion
exports.MessageTupleManager = MessageTupleManager;
exports.toMessageDict = toMessageDict;
//# sourceMappingURL=messages.cjs.map