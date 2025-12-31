const require_anthropic = require('./anthropic.cjs');
const require_openai = require('./openai.cjs');
const require_bedrock_converse = require('./bedrock_converse.cjs');
const require_google_genai = require('./google_genai.cjs');
const require_google_vertexai = require('./google_vertexai.cjs');

//#region src/messages/block_translators/index.ts
globalThis.lc_block_translators_registry ??= new Map([
	["anthropic", require_anthropic.ChatAnthropicTranslator],
	["bedrock-converse", require_bedrock_converse.ChatBedrockConverseTranslator],
	["google-genai", require_google_genai.ChatGoogleGenAITranslator],
	["google-vertexai", require_google_vertexai.ChatVertexTranslator],
	["openai", require_openai.ChatOpenAITranslator]
]);
function getTranslator(modelProvider) {
	return globalThis.lc_block_translators_registry.get(modelProvider);
}

//#endregion
exports.getTranslator = getTranslator;
//# sourceMappingURL=index.cjs.map