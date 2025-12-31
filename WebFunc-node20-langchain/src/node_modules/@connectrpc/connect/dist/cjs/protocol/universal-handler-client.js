"use strict";
// Copyright 2021-2024 The Connect Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUniversalHandlerClient = createUniversalHandlerClient;
const code_js_1 = require("../code.js");
const connect_error_js_1 = require("../connect-error.js");
const async_iterable_js_1 = require("./async-iterable.js");
const signals_js_1 = require("./signals.js");
/**
 * An in-memory UniversalClientFn that can be used to route requests to a ConnectRouter
 * bypassing network calls. Useful for testing and calling in-process services.
 */
function createUniversalHandlerClient(uHandlers) {
    const handlerMap = new Map();
    for (const handler of uHandlers) {
        handlerMap.set(handler.requestPath, handler);
    }
    return async (uClientReq) => {
        var _a, _b, _c;
        const pathname = new URL(uClientReq.url).pathname;
        const handler = handlerMap.get(pathname);
        if (!handler) {
            throw new connect_error_js_1.ConnectError(`RouterHttpClient: no handler registered for ${pathname}`, code_js_1.Code.Unimplemented);
        }
        const reqSignal = (_a = uClientReq.signal) !== null && _a !== void 0 ? _a : new AbortController().signal;
        const uServerRes = await raceSignal(reqSignal, handler({
            body: (_b = uClientReq.body) !== null && _b !== void 0 ? _b : (0, async_iterable_js_1.createAsyncIterable)([]),
            httpVersion: "2.0",
            method: uClientReq.method,
            url: uClientReq.url,
            header: uClientReq.header,
            signal: reqSignal,
        }));
        const body = (_c = uServerRes.body) !== null && _c !== void 0 ? _c : (0, async_iterable_js_1.createAsyncIterable)([]);
        return {
            body: (0, async_iterable_js_1.pipe)(body, (iterable) => {
                return {
                    [Symbol.asyncIterator]() {
                        const it = iterable[Symbol.asyncIterator]();
                        const w = {
                            next() {
                                return raceSignal(reqSignal, it.next());
                            },
                        };
                        if (it.throw !== undefined) {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- can't handle mutated object sensibly
                            w.throw = (e) => it.throw(e);
                        }
                        if (it.return !== undefined) {
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion,@typescript-eslint/no-explicit-any -- can't handle mutated object sensibly
                            w.return = (value) => it.return(value);
                        }
                        return w;
                    },
                };
            }),
            header: new Headers(uServerRes.header),
            status: uServerRes.status,
            trailer: new Headers(uServerRes.trailer),
        };
    };
}
/**
 * Wrap a promise, and reject early if the given signal triggers before the
 * promise is settled.
 */
function raceSignal(signal, promise) {
    let cleanup;
    const signalPromise = new Promise((_, reject) => {
        const onAbort = () => reject((0, signals_js_1.getAbortSignalReason)(signal));
        if (signal.aborted) {
            return onAbort();
        }
        signal.addEventListener("abort", onAbort);
        cleanup = () => signal.removeEventListener("abort", onAbort);
    });
    return Promise.race([signalPromise, promise]).finally(cleanup);
}
