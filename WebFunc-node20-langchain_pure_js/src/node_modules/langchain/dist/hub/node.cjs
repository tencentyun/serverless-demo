const require_chat_models_universal = require('../chat_models/universal.cjs');
const require_load_index = require('../load/index.cjs');
const require_base = require('./base.cjs');

//#region src/hub/node.ts
function _idEquals(a, b) {
	if (!Array.isArray(a) || !Array.isArray(b)) return false;
	if (a.length !== b.length) return false;
	for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
	return true;
}
function isRunnableBinding(a) {
	const wellKnownIds = [[
		"langchain_core",
		"runnables",
		"RunnableBinding"
	], [
		"langchain",
		"schema",
		"runnable",
		"RunnableBinding"
	]];
	return wellKnownIds.some((id) => _idEquals(a, id));
}
/**
* Pull a prompt from the hub.
* @param ownerRepoCommit The name of the repo containing the prompt, as well as an optional commit hash separated by a slash.
* @param options.apiKey LangSmith API key to use when pulling the prompt
* @param options.apiUrl LangSmith API URL to use when pulling the prompt
* @param options.includeModel Whether to also instantiate and attach a model instance to the prompt,
*   if the prompt has associated model metadata. If set to true, invoking the resulting pulled prompt will
*   also invoke the instantiated model. You must have the appropriate LangChain integration package installed.
* @param options.secrets A map of secrets to use when loading, e.g.
*   {'OPENAI_API_KEY': 'sk-...'}`.
*   If a secret is not found in the map, it will be loaded from the
*   environment if `secrets_from_env` is `True`. Should only be needed when
*   `includeModel` is `true`.
* @param options.secretsFromEnv Whether to load secrets from environment variables.
*   Use with caution and only with trusted prompts.
* @returns
*/
async function pull(ownerRepoCommit, options) {
	const promptObject = await require_base.basePull(ownerRepoCommit, options);
	let modelClass;
	if (options?.includeModel) {
		const chatModelObject = isRunnableBinding(promptObject.manifest.kwargs?.last?.id) ? promptObject.manifest.kwargs?.last?.kwargs?.bound : promptObject.manifest.kwargs?.last;
		if (Array.isArray(chatModelObject?.id)) {
			const modelName = chatModelObject?.id.at(-1);
			if (modelName) {
				modelClass = await require_chat_models_universal.getChatModelByClassName(modelName);
				if (!modelClass) console.warn(`Received unknown model name from prompt hub: "${modelName}"`);
			}
		}
	}
	const loadedPrompt = await require_load_index.load(JSON.stringify(promptObject.manifest), options?.secrets, require_base.generateOptionalImportMap(modelClass), require_base.generateModelImportMap(modelClass), options?.secretsFromEnv);
	return require_base.bindOutputSchema(loadedPrompt);
}

//#endregion
exports.pull = pull;
exports.push = require_base.basePush;
//# sourceMappingURL=node.cjs.map