import { ChatAnthropicTranslator } from "./anthropic.js";
import { ChatOpenAITranslator } from "./openai.js";
import { ChatBedrockConverseTranslator } from "./bedrock_converse.js";
import { ChatGoogleGenAITranslator } from "./google_genai.js";
import { ChatVertexTranslator } from "./google_vertexai.js";

//#region src/messages/block_translators/index.ts
globalThis.lc_block_translators_registry ??= new Map([
	["anthropic", ChatAnthropicTranslator],
	["bedrock-converse", ChatBedrockConverseTranslator],
	["google-genai", ChatGoogleGenAITranslator],
	["google-vertexai", ChatVertexTranslator],
	["openai", ChatOpenAITranslator]
]);
function getTranslator(modelProvider) {
	return globalThis.lc_block_translators_registry.get(modelProvider);
}

//#endregion
export { getTranslator };
//# sourceMappingURL=index.js.map