import { __export } from "../_virtual/rolldown_runtime.js";
import { getAbortSignalError } from "./signal.js";
import { pRetry } from "./p-retry/index.js";
import PQueueMod from "p-queue";

//#region src/utils/async_caller.ts
var async_caller_exports = {};
__export(async_caller_exports, { AsyncCaller: () => AsyncCaller });
const STATUS_NO_RETRY = [
	400,
	401,
	402,
	403,
	404,
	405,
	406,
	407,
	409
];
const defaultFailedAttemptHandler = (error) => {
	if (error.message.startsWith("Cancel") || error.message.startsWith("AbortError") || error.name === "AbortError") throw error;
	if (error?.code === "ECONNABORTED") throw error;
	const status = error?.response?.status ?? error?.status;
	if (status && STATUS_NO_RETRY.includes(+status)) throw error;
	if (error?.error?.code === "insufficient_quota") {
		const err = new Error(error?.message);
		err.name = "InsufficientQuotaError";
		throw err;
	}
};
/**
* A class that can be used to make async calls with concurrency and retry logic.
*
* This is useful for making calls to any kind of "expensive" external resource,
* be it because it's rate-limited, subject to network issues, etc.
*
* Concurrent calls are limited by the `maxConcurrency` parameter, which defaults
* to `Infinity`. This means that by default, all calls will be made in parallel.
*
* Retries are limited by the `maxRetries` parameter, which defaults to 6. This
* means that by default, each call will be retried up to 6 times, with an
* exponential backoff between each attempt.
*/
var AsyncCaller = class {
	maxConcurrency;
	maxRetries;
	onFailedAttempt;
	queue;
	constructor(params) {
		this.maxConcurrency = params.maxConcurrency ?? Infinity;
		this.maxRetries = params.maxRetries ?? 6;
		this.onFailedAttempt = params.onFailedAttempt ?? defaultFailedAttemptHandler;
		const PQueue = "default" in PQueueMod ? PQueueMod.default : PQueueMod;
		this.queue = new PQueue({ concurrency: this.maxConcurrency });
	}
	async call(callable, ...args) {
		return this.queue.add(() => pRetry(() => callable(...args).catch((error) => {
			if (error instanceof Error) throw error;
			else throw new Error(error);
		}), {
			onFailedAttempt: ({ error }) => this.onFailedAttempt?.(error),
			retries: this.maxRetries,
			randomize: true
		}), { throwOnTimeout: true });
	}
	callWithOptions(options, callable, ...args) {
		if (options.signal) {
			let listener;
			return Promise.race([this.call(callable, ...args), new Promise((_, reject) => {
				listener = () => {
					reject(getAbortSignalError(options.signal));
				};
				options.signal?.addEventListener("abort", listener);
			})]).finally(() => {
				if (options.signal && listener) options.signal.removeEventListener("abort", listener);
			});
		}
		return this.call(callable, ...args);
	}
	fetch(...args) {
		return this.call(() => fetch(...args).then((res) => res.ok ? res : Promise.reject(res)));
	}
};

//#endregion
export { AsyncCaller, async_caller_exports };
//# sourceMappingURL=async_caller.js.map