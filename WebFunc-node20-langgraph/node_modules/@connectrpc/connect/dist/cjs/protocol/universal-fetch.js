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
exports.createFetchClient = createFetchClient;
exports.createFetchHandler = createFetchHandler;
exports.universalClientRequestToFetch = universalClientRequestToFetch;
exports.universalClientResponseFromFetch = universalClientResponseFromFetch;
exports.universalServerRequestFromFetch = universalServerRequestFromFetch;
exports.universalServerResponseToFetch = universalServerResponseToFetch;
/**
 * Create a universal client function, a minimal abstraction of an HTTP client,
 * using the given fetch() implementation.
 */
function createFetchClient(fetchFn) {
    return async function fetchClient(request) {
        const res = await fetchFn(universalClientRequestToFetch(request));
        return universalClientResponseFromFetch(res);
    };
}
/**
 * Convert a universal handler function to a fetch handler.
 */
function createFetchHandler(uHandler, options) {
    async function handleFetch(req) {
        const uReq = universalServerRequestFromFetch(req, options !== null && options !== void 0 ? options : {});
        const uRes = await uHandler(uReq);
        return universalServerResponseToFetch(uRes);
    }
    return Object.assign(handleFetch, uHandler);
}
/**
 * Convert a universal client request to a fetch request.
 */
function universalClientRequestToFetch(req) {
    const body = req.body === undefined ? null : iterableToReadableStream(req.body);
    return new Request(req.url, {
        method: req.method,
        headers: req.header,
        signal: req.signal,
        body,
    });
}
/**
 * Convert a fetch response to a universal client response.
 */
function universalClientResponseFromFetch(res) {
    return {
        status: res.status,
        header: res.headers,
        body: iterableFromReadableStream(res.body),
        trailer: new Headers(),
    };
}
/**
 * Convert a fetch request to a universal server request.
 */
function universalServerRequestFromFetch(req, options) {
    var _a;
    return {
        httpVersion: (_a = options.httpVersion) !== null && _a !== void 0 ? _a : "",
        method: req.method,
        url: req.url,
        header: req.headers,
        body: iterableFromReadableStream(req.body),
        signal: req.signal,
    };
}
/**
 * Convert a universal server response to a fetch response.
 */
function universalServerResponseToFetch(res) {
    let body = null;
    if (res.body !== undefined) {
        body = iterableToReadableStream(res.body);
    }
    return new Response(body, {
        status: res.status,
        headers: res.header,
    });
}
function iterableToReadableStream(iterable) {
    const it = iterable[Symbol.asyncIterator]();
    return new ReadableStream({
        async pull(controller) {
            const r = await it.next();
            if (r.done === true) {
                controller.close();
                return;
            }
            controller.enqueue(r.value);
        },
        async cancel(reason) {
            if (it.throw) {
                try {
                    await it.throw(reason);
                }
                catch (_a) {
                    // iterator.throw on a generator function rethrows unless the
                    // body catches and swallows.
                }
            }
        },
    });
}
function iterableFromReadableStream(body) {
    const reader = body === null || body === void 0 ? void 0 : body.getReader();
    return {
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    if (reader !== undefined) {
                        const r = await reader.read();
                        if (r.done) {
                            return {
                                done: true,
                                value: undefined,
                            };
                        }
                        return r;
                    }
                    return {
                        done: true,
                        value: undefined,
                    };
                },
                async throw(e) {
                    if (reader !== undefined) {
                        await reader.cancel(e);
                    }
                    return {
                        done: true,
                        value: undefined,
                    };
                },
            };
        },
    };
}
