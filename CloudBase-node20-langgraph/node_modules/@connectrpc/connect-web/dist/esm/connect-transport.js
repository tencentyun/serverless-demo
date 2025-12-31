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
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = Object.create((typeof AsyncIterator === "function" ? AsyncIterator : Object).prototype), verb("next"), verb("throw"), verb("return", awaitReturn), i[Symbol.asyncIterator] = function () { return this; }, i;
    function awaitReturn(f) { return function (v) { return Promise.resolve(v).then(f, reject); }; }
    function verb(n, f) { if (g[n]) { i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; if (f) i[n] = f(i[n]); } }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
import { fromJson } from "@bufbuild/protobuf";
import { Code, ConnectError, appendHeaders, createContextValues, } from "@connectrpc/connect";
import { createClientMethodSerializers, createEnvelopeReadableStream, createMethodUrl, getJsonOptions, encodeEnvelope, runStreamingCall, runUnaryCall, compressedFlag, } from "@connectrpc/connect/protocol";
import { endStreamFlag, endStreamFromJson, errorFromJson, requestHeader, trailerDemux, transformConnectPostToGetRequest, validateResponse, } from "@connectrpc/connect/protocol-connect";
import { assertFetchApi } from "./assert-fetch-api.js";
import { MethodOptions_IdempotencyLevel } from "@bufbuild/protobuf/wkt";
const fetchOptions = {
    redirect: "error",
};
/**
 * Create a Transport for the Connect protocol, which makes unary and
 * server-streaming methods available to web browsers. It uses the fetch
 * API to make HTTP requests.
 */
export function createConnectTransport(options) {
    var _a;
    assertFetchApi();
    const useBinaryFormat = (_a = options.useBinaryFormat) !== null && _a !== void 0 ? _a : false;
    return {
        async unary(method, signal, timeoutMs, header, message, contextValues) {
            const { serialize, parse } = createClientMethodSerializers(method, useBinaryFormat, options.jsonOptions, options.binaryOptions);
            timeoutMs =
                timeoutMs === undefined
                    ? options.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return await runUnaryCall({
                interceptors: options.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: false,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: createMethodUrl(options.baseUrl, method),
                    header: requestHeader(method.methodKind, useBinaryFormat, timeoutMs, header, false),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : createContextValues(),
                    message,
                },
                next: async (req) => {
                    var _a;
                    const useGet = options.useHttpGet === true &&
                        method.idempotency ===
                            MethodOptions_IdempotencyLevel.NO_SIDE_EFFECTS;
                    let body = null;
                    if (useGet) {
                        req = transformConnectPostToGetRequest(req, serialize(req.message), useBinaryFormat);
                    }
                    else {
                        body = serialize(req.message);
                    }
                    const fetch = (_a = options.fetch) !== null && _a !== void 0 ? _a : globalThis.fetch;
                    const response = await fetch(req.url, Object.assign(Object.assign({}, fetchOptions), { method: req.requestMethod, headers: req.header, signal: req.signal, body }));
                    const { isUnaryError, unaryError } = validateResponse(method.methodKind, useBinaryFormat, response.status, response.headers);
                    if (isUnaryError) {
                        throw errorFromJson((await response.json()), appendHeaders(...trailerDemux(response.headers)), unaryError);
                    }
                    const [demuxedHeader, demuxedTrailer] = trailerDemux(response.headers);
                    return {
                        stream: false,
                        service: method.parent,
                        method,
                        header: demuxedHeader,
                        message: useBinaryFormat
                            ? parse(new Uint8Array(await response.arrayBuffer()))
                            : fromJson(method.output, (await response.json()), getJsonOptions(options.jsonOptions)),
                        trailer: demuxedTrailer,
                    };
                },
            });
        },
        async stream(method, signal, timeoutMs, header, input, contextValues) {
            const { serialize, parse } = createClientMethodSerializers(method, useBinaryFormat, options.jsonOptions, options.binaryOptions);
            function parseResponseBody(body, trailerTarget, header, signal) {
                return __asyncGenerator(this, arguments, function* parseResponseBody_1() {
                    const reader = createEnvelopeReadableStream(body).getReader();
                    let endStreamReceived = false;
                    for (;;) {
                        const result = yield __await(reader.read());
                        if (result.done) {
                            break;
                        }
                        const { flags, data } = result.value;
                        if ((flags & compressedFlag) === compressedFlag) {
                            throw new ConnectError(`protocol error: received unsupported compressed output`, Code.Internal);
                        }
                        if ((flags & endStreamFlag) === endStreamFlag) {
                            endStreamReceived = true;
                            const endStream = endStreamFromJson(data);
                            if (endStream.error) {
                                const error = endStream.error;
                                header.forEach((value, key) => {
                                    error.metadata.append(key, value);
                                });
                                throw error;
                            }
                            endStream.metadata.forEach((value, key) => trailerTarget.set(key, value));
                            continue;
                        }
                        yield yield __await(parse(data));
                    }
                    // Node wil not throw an AbortError on `read` if the
                    // signal is aborted before `getReader` is called.
                    // As a work around we check at the end and throw.
                    //
                    // Ref: https://github.com/nodejs/undici/issues/1940
                    if ("throwIfAborted" in signal) {
                        // We assume that implementations without `throwIfAborted` (old
                        // browsers) do honor aborted signals on `read`.
                        signal.throwIfAborted();
                    }
                    if (!endStreamReceived) {
                        throw "missing EndStreamResponse";
                    }
                });
            }
            async function createRequestBody(input) {
                if (method.methodKind != "server_streaming") {
                    throw "The fetch API does not support streaming request bodies";
                }
                const r = await input[Symbol.asyncIterator]().next();
                if (r.done == true) {
                    throw "missing request message";
                }
                return encodeEnvelope(0, serialize(r.value));
            }
            timeoutMs =
                timeoutMs === undefined
                    ? options.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return await runStreamingCall({
                interceptors: options.interceptors,
                timeoutMs,
                signal,
                req: {
                    stream: true,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: createMethodUrl(options.baseUrl, method),
                    header: requestHeader(method.methodKind, useBinaryFormat, timeoutMs, header, false),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : createContextValues(),
                    message: input,
                },
                next: async (req) => {
                    var _a;
                    const fetch = (_a = options.fetch) !== null && _a !== void 0 ? _a : globalThis.fetch;
                    const fRes = await fetch(req.url, Object.assign(Object.assign({}, fetchOptions), { method: req.requestMethod, headers: req.header, signal: req.signal, body: await createRequestBody(req.message) }));
                    validateResponse(method.methodKind, useBinaryFormat, fRes.status, fRes.headers);
                    if (fRes.body === null) {
                        throw "missing response body";
                    }
                    const trailer = new Headers();
                    const res = Object.assign(Object.assign({}, req), { header: fRes.headers, trailer, message: parseResponseBody(fRes.body, trailer, fRes.headers, req.signal) });
                    return res;
                },
            });
        },
    };
}
