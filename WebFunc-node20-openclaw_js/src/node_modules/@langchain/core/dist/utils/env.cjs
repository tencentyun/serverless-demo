const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');

//#region src/utils/env.ts
var env_exports = {};
require_rolldown_runtime.__export(env_exports, {
	getEnv: () => getEnv,
	getEnvironmentVariable: () => getEnvironmentVariable,
	getRuntimeEnvironment: () => getRuntimeEnvironment,
	isBrowser: () => isBrowser,
	isDeno: () => isDeno,
	isJsDom: () => isJsDom,
	isNode: () => isNode,
	isWebWorker: () => isWebWorker
});
const isBrowser = () => typeof window !== "undefined" && typeof window.document !== "undefined";
const isWebWorker = () => typeof globalThis === "object" && globalThis.constructor && globalThis.constructor.name === "DedicatedWorkerGlobalScope";
const isJsDom = () => typeof window !== "undefined" && window.name === "nodejs" || typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom");
const isDeno = () => typeof Deno !== "undefined";
const isNode = () => typeof process !== "undefined" && typeof process.versions !== "undefined" && typeof process.versions.node !== "undefined" && !isDeno();
const getEnv = () => {
	let env;
	if (isBrowser()) env = "browser";
	else if (isNode()) env = "node";
	else if (isWebWorker()) env = "webworker";
	else if (isJsDom()) env = "jsdom";
	else if (isDeno()) env = "deno";
	else env = "other";
	return env;
};
let runtimeEnvironment;
function getRuntimeEnvironment() {
	if (runtimeEnvironment === void 0) {
		const env = getEnv();
		runtimeEnvironment = {
			library: "langchain-js",
			runtime: env
		};
	}
	return runtimeEnvironment;
}
function getEnvironmentVariable(name) {
	try {
		if (typeof process !== "undefined") return process.env?.[name];
		else if (isDeno()) return Deno?.env.get(name);
		else return void 0;
	} catch {
		return void 0;
	}
}

//#endregion
Object.defineProperty(exports, 'env_exports', {
  enumerable: true,
  get: function () {
    return env_exports;
  }
});
exports.getEnv = getEnv;
exports.getEnvironmentVariable = getEnvironmentVariable;
exports.getRuntimeEnvironment = getRuntimeEnvironment;
exports.isBrowser = isBrowser;
exports.isDeno = isDeno;
exports.isJsDom = isJsDom;
exports.isNode = isNode;
exports.isWebWorker = isWebWorker;
//# sourceMappingURL=env.cjs.map