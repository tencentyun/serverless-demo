const require_index = require('../singletons/async_local_storage/index.cjs');
require('../singletons/index.cjs');
const require_config = require('./config.cjs');

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
		const { value, done } = require_index.AsyncLocalStorageProviderSingleton.runWithConfig(require_config.pickRunnableConfigKeys(context), iter.next.bind(iter), true);
		if (done) break;
		else yield value;
	}
}
async function* consumeAsyncIterableInContext(context, iter) {
	const iterator = iter[Symbol.asyncIterator]();
	while (true) {
		const { value, done } = await require_index.AsyncLocalStorageProviderSingleton.runWithConfig(require_config.pickRunnableConfigKeys(context), iterator.next.bind(iter), true);
		if (done) break;
		else yield value;
	}
}

//#endregion
exports.consumeAsyncIterableInContext = consumeAsyncIterableInContext;
exports.consumeIteratorInContext = consumeIteratorInContext;
exports.isAsyncIterable = isAsyncIterable;
exports.isIterableIterator = isIterableIterator;
exports.isIterator = isIterator;
//# sourceMappingURL=iter.cjs.map