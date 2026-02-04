import { __export } from "../_virtual/rolldown_runtime.js";
import { AsyncCaller } from "./async_caller.js";
import { Tiktoken, getEncodingNameForModel } from "js-tiktoken/lite";

//#region src/utils/tiktoken.ts
var tiktoken_exports = {};
__export(tiktoken_exports, {
	encodingForModel: () => encodingForModel,
	getEncoding: () => getEncoding
});
const cache = {};
const caller = /* @__PURE__ */ new AsyncCaller({});
async function getEncoding(encoding) {
	if (!(encoding in cache)) cache[encoding] = caller.fetch(`https://tiktoken.pages.dev/js/${encoding}.json`).then((res) => res.json()).then((data) => new Tiktoken(data)).catch((e) => {
		delete cache[encoding];
		throw e;
	});
	return await cache[encoding];
}
async function encodingForModel(model) {
	return getEncoding(getEncodingNameForModel(model));
}

//#endregion
export { encodingForModel, getEncoding, tiktoken_exports };
//# sourceMappingURL=tiktoken.js.map