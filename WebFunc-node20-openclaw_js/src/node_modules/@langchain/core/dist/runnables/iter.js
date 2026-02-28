import { AsyncLocalStorageProviderSingleton } from "../singletons/async_local_storage/index.js";
import "../singletons/index.js";
import { pickRunnableConfigKeys } from "./config.js";

//#region src/runnables/iter.ts
function isIterableIterator(thing) {
	return typeof thing === "object" && thing !== null && typeof thing[Symbol.iterator] === "function" && typeof thing.next === "function";
}
const isIterator = (x) => x != null && typeof x === "object" && "next" in x && typeof x.next === "function";
function isAsyncIterable(thing) {
	return typeof thing === "object" && thing !== null && typeof thing[Symbol.asyncIterator] === "function";
}
function* consumeIteratorInContext(context, iter) {
	while (true) {
		const { value, done } = AsyncLocalStorageProviderSingleton.runWithConfig(pickRunnableConfigKeys(context), iter.next.bind(iter), true);
		if (done) break;
		else yield value;
	}
}
async function* consumeAsyncIterableInContext(context, iter) {
	const iterator = iter[Symbol.asyncIterator]();
	while (true) {
		const { value, done } = await AsyncLocalStorageProviderSingleton.runWithConfig(pickRunnableConfigKeys(context), iterator.next.bind(iter), true);
		if (done) break;
		else yield value;
	}
}

//#endregion
export { consumeAsyncIterableInContext, consumeIteratorInContext, isAsyncIterable, isIterableIterator, isIterator };
//# sourceMappingURL=iter.js.map