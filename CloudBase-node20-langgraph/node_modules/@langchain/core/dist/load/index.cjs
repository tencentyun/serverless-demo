const require_map_keys = require('./map_keys.cjs');
const require_validation = require('./validation.cjs');
const require_load_serializable = require('./serializable.cjs');
const require_utils_env = require('../utils/env.cjs');
const require_import_constants = require('./import_constants.cjs');
const require_import_map = require('./import_map.cjs');

//#region src/load/index.ts
/**
* Default maximum recursion depth for deserialization.
* This provides protection against DoS attacks via deeply nested structures.
*/
const DEFAULT_MAX_DEPTH = 50;
function combineAliasesAndInvert(constructor) {
	const aliases = {};
	for (let current = constructor; current && current.prototype; current = Object.getPrototypeOf(current)) Object.assign(aliases, Reflect.get(current.prototype, "lc_aliases"));
	return Object.entries(aliases).reduce((acc, [key, value]) => {
		acc[value] = key;
		return acc;
	}, {});
}
/**
* Recursively revive a value, handling escape markers and LC objects.
*
* This function handles:
* 1. Escaped dicts - unwrapped and returned as plain objects
* 2. LC secret objects - resolved from secretsMap or env
* 3. LC constructor objects - instantiated
* 4. Regular objects/arrays - recursed into
*/
async function reviver(value) {
	const { optionalImportsMap, optionalImportEntrypoints: optionalImportEntrypoints$1, importMap, secretsMap, secretsFromEnv, path, depth, maxDepth } = this;
	const pathStr = path.join(".");
	if (depth > maxDepth) throw new Error(`Maximum recursion depth (${maxDepth}) exceeded during deserialization. This may indicate a malicious payload or you may need to increase maxDepth.`);
	if (typeof value !== "object" || value == null) return value;
	if (Array.isArray(value)) return Promise.all(value.map((v, i) => reviver.call({
		...this,
		path: [...path, `${i}`],
		depth: depth + 1
	}, v)));
	const record = value;
	if (require_validation.isEscapedObject(record)) return require_validation.unescapeValue(record);
	if ("lc" in record && "type" in record && "id" in record && record.lc === 1 && record.type === "secret") {
		const serialized = record;
		const [key] = serialized.id;
		if (key in secretsMap) return secretsMap[key];
		else if (secretsFromEnv) {
			const secretValueInEnv = require_utils_env.getEnvironmentVariable(key);
			if (secretValueInEnv) return secretValueInEnv;
		}
		throw new Error(`Missing secret "${key}" at ${pathStr}`);
	}
	if ("lc" in record && "type" in record && "id" in record && record.lc === 1 && record.type === "not_implemented") {
		const serialized = record;
		const str = JSON.stringify(serialized);
		throw new Error(`Trying to load an object that doesn't implement serialization: ${pathStr} -> ${str}`);
	}
	if ("lc" in record && "type" in record && "id" in record && "kwargs" in record && record.lc === 1 && record.type === "constructor") {
		const serialized = record;
		const str = JSON.stringify(serialized);
		const [name, ...namespaceReverse] = serialized.id.slice().reverse();
		const namespace = namespaceReverse.reverse();
		const importMaps = {
			langchain_core: require_import_map.import_map_exports,
			langchain: importMap
		};
		let module$1 = null;
		const optionalImportNamespaceAliases = [namespace.join("/")];
		if (namespace[0] === "langchain_community") optionalImportNamespaceAliases.push(["langchain", ...namespace.slice(1)].join("/"));
		const matchingNamespaceAlias = optionalImportNamespaceAliases.find((alias) => alias in optionalImportsMap);
		if (require_import_constants.optionalImportEntrypoints.concat(optionalImportEntrypoints$1).includes(namespace.join("/")) || matchingNamespaceAlias) if (matchingNamespaceAlias !== void 0) module$1 = await optionalImportsMap[matchingNamespaceAlias];
		else throw new Error(`Missing key "${namespace.join("/")}" for ${pathStr} in load(optionalImportsMap={})`);
		else {
			let finalImportMap;
			if (namespace[0] === "langchain" || namespace[0] === "langchain_core") {
				finalImportMap = importMaps[namespace[0]];
				namespace.shift();
			} else throw new Error(`Invalid namespace: ${pathStr} -> ${str}`);
			if (namespace.length === 0) throw new Error(`Invalid namespace: ${pathStr} -> ${str}`);
			let importMapKey;
			do {
				importMapKey = namespace.join("__");
				if (importMapKey in finalImportMap) break;
				else namespace.pop();
			} while (namespace.length > 0);
			if (importMapKey in finalImportMap) module$1 = finalImportMap[importMapKey];
		}
		if (typeof module$1 !== "object" || module$1 === null) throw new Error(`Invalid namespace: ${pathStr} -> ${str}`);
		const builder = module$1[name] ?? Object.values(module$1).find((v) => typeof v === "function" && require_load_serializable.get_lc_unique_name(v) === name);
		if (typeof builder !== "function") throw new Error(`Invalid identifer: ${pathStr} -> ${str}`);
		const kwargs = await reviver.call({
			...this,
			path: [...path, "kwargs"],
			depth: depth + 1
		}, serialized.kwargs);
		const instance = new builder(require_map_keys.mapKeys(kwargs, require_map_keys.keyFromJson, combineAliasesAndInvert(builder)));
		Object.defineProperty(instance.constructor, "name", { value: name });
		return instance;
	}
	const result = {};
	for (const [key, val] of Object.entries(record)) result[key] = await reviver.call({
		...this,
		path: [...path, key],
		depth: depth + 1
	}, val);
	return result;
}
/**
* Load a LangChain object from a JSON string.
*
* @param text - The JSON string to parse and load.
* @param options - Options for loading.
* @returns The loaded LangChain object.
*
* @example
* ```typescript
* import { load } from "@langchain/core/load";
* import { AIMessage } from "@langchain/core/messages";
*
* // Basic usage - secrets must be provided explicitly
* const msg = await load<AIMessage>(jsonString);
*
* // With secrets from a map
* const msg = await load<AIMessage>(jsonString, {
*   secretsMap: { OPENAI_API_KEY: "sk-..." }
* });
*
* // Allow loading secrets from environment (use with caution)
* const msg = await load<AIMessage>(jsonString, {
*   secretsFromEnv: true
* });
* ```
*/
async function load(text, options) {
	const json = JSON.parse(text);
	const context = {
		optionalImportsMap: options?.optionalImportsMap ?? {},
		optionalImportEntrypoints: options?.optionalImportEntrypoints ?? [],
		secretsMap: options?.secretsMap ?? {},
		secretsFromEnv: options?.secretsFromEnv ?? false,
		importMap: options?.importMap ?? {},
		path: ["$"],
		depth: 0,
		maxDepth: options?.maxDepth ?? DEFAULT_MAX_DEPTH
	};
	return reviver.call(context, json);
}

//#endregion
exports.load = load;
//# sourceMappingURL=index.cjs.map