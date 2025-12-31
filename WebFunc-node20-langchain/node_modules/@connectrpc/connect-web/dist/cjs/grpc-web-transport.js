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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGrpcWebTransport = createGrpcWebTransport;
const connect_1 = require("@connectrpc/connect");
const protocol_1 = require("@connectrpc/connect/protocol");
const protocol_grpc_web_1 = require("@connectrpc/connect/protocol-grpc-web");
const assert_fetch_api_js_1 = require("./assert-fetch-api.js");
const fetchOptions = {
    redirect: "error",
};
/**
 * Create a Transport for the gRPC-web protocol. The protocol encodes
 * trailers in the response body and makes unary and server-streaming
 * methods available to web browsers. It uses the fetch API to make
 * HTTP requests.
 *
 * Note that this transport does not implement the grpc-web-text format,
 * which applies base64 encoding to the request and response bodies to
 * support reading streaming responses from an XMLHttpRequest.
 */
function createGrpcWebTransport(options) {
    var _a;
    (0, assert_fetch_api_js_1.assertFetchApi)();
    const useBinaryFormat = (_a = options.useBinaryFormat) !== null && _a !== void 0 ? _a : true;
    return {
        async unary(method, signal, timeoutMs, header, message, contextValues) {
            const { serialize, parse } = (0, protocol_1.createClientMethodSerializers)(method, useBinaryFormat, options.jsonOptions, options.binaryOptions);
            timeoutMs =
                timeoutMs === undefined
                    ? options.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return await (0, protocol_1.runUnaryCall)({
                interceptors: options.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: false,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: (0, protocol_1.createMethodUrl)(options.baseUrl, method),
                    header: (0, protocol_grpc_web_1.requestHeader)(useBinaryFormat, timeoutMs, header, false),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : (0, connect_1.createContextValues)(),
                    message,
                },
                next: async (req) => {
                    var _a;
                    const fetch = (_a = options.fetch) !== null && _a !== void 0 ? _a : globalThis.fetch;
                    const response = await fetch(req.url, Object.assign(Object.assign({}, fetchOptions), { method: req.requestMethod, headers: req.header, signal: req.signal, body: (0, protocol_1.encodeEnvelope)(0, serialize(req.message)) }));
                    const { headerError } = (0, protocol_grpc_web_1.validateResponse)(response.status, response.headers);
                    if (!response.body) {
                        if (headerError !== undefined)
                            throw headerError;
                        throw "missing response body";
                    }
                    const reader = (0, protocol_1.createEnvelopeReadableStream)(response.body).getReader();
                    let trailer;
                    let message;
                    for (;;) {
                        const r = await reader.read();
                        if (r.done) {
                            break;
                        }
                        const { flags, data } = r.value;
                        if ((flags & protocol_1.compressedFlag) === protocol_1.compressedFlag) {
                            throw new connect_1.ConnectError(`protocol error: received unsupported compressed output`, connect_1.Code.Internal);
                        }
                        if (flags === protocol_grpc_web_1.trailerFlag) {
                            if (trailer !== undefined) {
                                throw "extra trailer";
                            }
                            // Unary responses require exactly one response message, but in
                            // case of an error, it is perfectly valid to have a response body
                            // that only contains error trailers.
                            trailer = (0, protocol_grpc_web_1.trailerParse)(data);
                            continue;
                        }
                        if (message !== undefined) {
                            throw new connect_1.ConnectError("extra message", connect_1.Code.Unimplemented);
                        }
                        message = parse(data);
                    }
                    if (trailer === undefined) {
                        if (headerError !== undefined)
                            throw headerError;
                        throw new connect_1.ConnectError("missing trailer", response.headers.has(protocol_grpc_web_1.headerGrpcStatus)
                            ? connect_1.Code.Unimplemented
                            : connect_1.Code.Unknown);
                    }
                    (0, protocol_grpc_web_1.validateTrailer)(trailer, response.headers);
                    if (message === undefined) {
                        throw new connect_1.ConnectError("missing message", trailer.has(protocol_grpc_web_1.headerGrpcStatus) ? connect_1.Code.Unimplemented : connect_1.Code.Unknown);
                    }
                    return {
                        stream: false,
                        service: method.parent,
                        method,
                        header: response.headers,
                        message,
                        trailer,
                    };
                },
            });
        },
        async stream(method, signal, timeoutMs, header, input, contextValues) {
            const { serialize, parse } = (0, protocol_1.createClientMethodSerializers)(method, useBinaryFormat, options.jsonOptions, options.binaryOptions);
            function parseResponseBody(body, foundStatus, trailerTarget, header, signal) {
                return __asyncGenerator(this, arguments, function* parseResponseBody_1() {
                    const reader = (0, protocol_1.createEnvelopeReadableStream)(body).getReader();
                    if (foundStatus) {
                        // A grpc-status: 0 response header was present. This is a "trailers-only"
                        // response (a response without a body and no trailers).
                        //
                        // The spec seems to disallow a trailers-only response for status 0 - we are
                        // lenient and only verify that the body is empty.
                        //
                        // > [...] Trailers-Only is permitted for calls that produce an immediate error.
                        // See https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
                        if (!(yield __await(reader.read())).done) {
                            throw "extra data for trailers-only";
                        }
                        return yield __await(void 0);
                    }
                    let trailerReceived = false;
                    for (;;) {
                        const result = yield __await(reader.read());
                        if (result.done) {
                            break;
                        }
                        const { flags, data } = result.value;
                        if ((flags & protocol_grpc_web_1.trailerFlag) === protocol_grpc_web_1.trailerFlag) {
                            if (trailerReceived) {
                                throw "extra trailer";
                            }
                            trailerReceived = true;
                            const trailer = (0, protocol_grpc_web_1.trailerParse)(data);
                            (0, protocol_grpc_web_1.validateTrailer)(trailer, header);
                            trailer.forEach((value, key) => trailerTarget.set(key, value));
                            continue;
                        }
                        if (trailerReceived) {
                            throw "extra message";
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
                    if (!trailerReceived) {
                        throw "missing trailer";
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
                return (0, protocol_1.encodeEnvelope)(0, serialize(r.value));
            }
            timeoutMs =
                timeoutMs === undefined
                    ? options.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return (0, protocol_1.runStreamingCall)({
                interceptors: options.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: true,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: (0, protocol_1.createMethodUrl)(options.baseUrl, method),
                    header: (0, protocol_grpc_web_1.requestHeader)(useBinaryFormat, timeoutMs, header, false),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : (0, connect_1.createContextValues)(),
                    message: input,
                },
                next: async (req) => {
                    var _a;
                    const fetch = (_a = options.fetch) !== null && _a !== void 0 ? _a : globalThis.fetch;
                    const fRes = await fetch(req.url, Object.assign(Object.assign({}, fetchOptions), { method: req.requestMethod, headers: req.header, signal: req.signal, body: await createRequestBody(req.message) }));
                    const { foundStatus, headerError } = (0, protocol_grpc_web_1.validateResponse)(fRes.status, fRes.headers);
                    if (headerError != undefined) {
                        throw headerError;
                    }
                    if (!fRes.body) {
                        throw "missing response body";
                    }
                    const trailer = new Headers();
                    const res = Object.assign(Object.assign({}, req), { header: fRes.headers, trailer, message: parseResponseBody(fRes.body, foundStatus, trailer, fRes.headers, req.signal) });
                    return res;
                },
            });
        },
    };
}
