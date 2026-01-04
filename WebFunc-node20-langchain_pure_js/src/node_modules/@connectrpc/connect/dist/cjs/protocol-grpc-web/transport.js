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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
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
exports.createTransport = createTransport;
const validate_trailer_js_1 = require("../protocol-grpc/validate-trailer.js");
const request_header_js_1 = require("./request-header.js");
const validate_response_js_1 = require("./validate-response.js");
const trailer_js_1 = require("./trailer.js");
const code_js_1 = require("../code.js");
const connect_error_js_1 = require("../connect-error.js");
const async_iterable_js_1 = require("../protocol/async-iterable.js");
const create_method_url_js_1 = require("../protocol/create-method-url.js");
const run_call_js_1 = require("../protocol/run-call.js");
const serialization_js_1 = require("../protocol/serialization.js");
const context_values_js_1 = require("../context-values.js");
const headers_js_1 = require("./headers.js");
/**
 * Create a Transport for the gRPC-web protocol.
 */
function createTransport(opt) {
    return {
        async unary(method, signal, timeoutMs, header, message, contextValues) {
            const serialization = (0, serialization_js_1.createMethodSerializationLookup)(method, opt.binaryOptions, opt.jsonOptions, opt);
            timeoutMs =
                timeoutMs === undefined
                    ? opt.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return await (0, run_call_js_1.runUnaryCall)({
                interceptors: opt.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: false,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: (0, create_method_url_js_1.createMethodUrl)(opt.baseUrl, method),
                    header: (0, request_header_js_1.requestHeaderWithCompression)(opt.useBinaryFormat, timeoutMs, header, opt.acceptCompression, opt.sendCompression, true),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : (0, context_values_js_1.createContextValues)(),
                    message,
                },
                next: async (req) => {
                    const uRes = await opt.httpClient({
                        url: req.url,
                        method: req.requestMethod,
                        header: req.header,
                        signal: req.signal,
                        body: (0, async_iterable_js_1.pipe)((0, async_iterable_js_1.createAsyncIterable)([req.message]), (0, async_iterable_js_1.transformSerializeEnvelope)(serialization.getI(opt.useBinaryFormat)), (0, async_iterable_js_1.transformCompressEnvelope)(opt.sendCompression, opt.compressMinBytes), (0, async_iterable_js_1.transformJoinEnvelopes)(), {
                            propagateDownStreamError: true,
                        }),
                    });
                    const { compression, headerError } = (0, validate_response_js_1.validateResponseWithCompression)(opt.acceptCompression, uRes.status, uRes.header);
                    const { trailer, message } = await (0, async_iterable_js_1.pipeTo)(uRes.body, (0, async_iterable_js_1.transformSplitEnvelope)(opt.readMaxBytes), (0, async_iterable_js_1.transformDecompressEnvelope)(compression !== null && compression !== void 0 ? compression : null, opt.readMaxBytes), (0, async_iterable_js_1.transformParseEnvelope)(serialization.getO(opt.useBinaryFormat), trailer_js_1.trailerFlag, (0, trailer_js_1.createTrailerSerialization)()), async (iterable) => {
                        var _a, e_1, _b, _c;
                        let message;
                        let trailer;
                        try {
                            for (var _d = true, iterable_1 = __asyncValues(iterable), iterable_1_1; iterable_1_1 = await iterable_1.next(), _a = iterable_1_1.done, !_a; _d = true) {
                                _c = iterable_1_1.value;
                                _d = false;
                                const env = _c;
                                if (env.end) {
                                    if (trailer !== undefined) {
                                        throw new connect_error_js_1.ConnectError("protocol error: received extra trailer", code_js_1.Code.Unimplemented);
                                    }
                                    trailer = env.value;
                                }
                                else {
                                    if (message !== undefined) {
                                        throw new connect_error_js_1.ConnectError("protocol error: received extra output message for unary method", code_js_1.Code.Unimplemented);
                                    }
                                    message = env.value;
                                }
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (!_d && !_a && (_b = iterable_1.return)) await _b.call(iterable_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return { trailer, message };
                    }, {
                        propagateDownStreamError: false,
                    });
                    if (trailer === undefined) {
                        if (headerError != undefined) {
                            throw headerError;
                        }
                        throw new connect_error_js_1.ConnectError("protocol error: missing trailer", uRes.header.has(headers_js_1.headerGrpcStatus)
                            ? code_js_1.Code.Unimplemented
                            : code_js_1.Code.Unknown);
                    }
                    (0, validate_trailer_js_1.validateTrailer)(trailer, uRes.header);
                    if (message === undefined) {
                        throw new connect_error_js_1.ConnectError("protocol error: missing output message for unary method", trailer.has(headers_js_1.headerGrpcStatus) ? code_js_1.Code.Unimplemented : code_js_1.Code.Unknown);
                    }
                    return {
                        stream: false,
                        service: method.parent,
                        method,
                        header: uRes.header,
                        message,
                        trailer,
                    };
                },
            });
        },
        async stream(method, signal, timeoutMs, header, input, contextValues) {
            const serialization = (0, serialization_js_1.createMethodSerializationLookup)(method, opt.binaryOptions, opt.jsonOptions, opt);
            timeoutMs =
                timeoutMs === undefined
                    ? opt.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return (0, run_call_js_1.runStreamingCall)({
                interceptors: opt.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: true,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: (0, create_method_url_js_1.createMethodUrl)(opt.baseUrl, method),
                    header: (0, request_header_js_1.requestHeaderWithCompression)(opt.useBinaryFormat, timeoutMs, header, opt.acceptCompression, opt.sendCompression, true),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : (0, context_values_js_1.createContextValues)(),
                    message: input,
                },
                next: async (req) => {
                    const uRes = await opt.httpClient({
                        url: req.url,
                        method: req.requestMethod,
                        header: req.header,
                        signal: req.signal,
                        body: (0, async_iterable_js_1.pipe)(req.message, (0, async_iterable_js_1.transformSerializeEnvelope)(serialization.getI(opt.useBinaryFormat)), (0, async_iterable_js_1.transformCompressEnvelope)(opt.sendCompression, opt.compressMinBytes), (0, async_iterable_js_1.transformJoinEnvelopes)(), { propagateDownStreamError: true }),
                    });
                    const { compression, foundStatus, headerError } = (0, validate_response_js_1.validateResponseWithCompression)(opt.acceptCompression, uRes.status, uRes.header);
                    if (headerError) {
                        throw headerError;
                    }
                    const res = Object.assign(Object.assign({}, req), { header: uRes.header, trailer: new Headers(), message: (0, async_iterable_js_1.pipe)(uRes.body, (0, async_iterable_js_1.transformSplitEnvelope)(opt.readMaxBytes), (0, async_iterable_js_1.transformDecompressEnvelope)(compression !== null && compression !== void 0 ? compression : null, opt.readMaxBytes), (0, async_iterable_js_1.transformParseEnvelope)(serialization.getO(opt.useBinaryFormat), trailer_js_1.trailerFlag, (0, trailer_js_1.createTrailerSerialization)()), function (iterable) {
                            return __asyncGenerator(this, arguments, function* () {
                                var _a, e_2, _b, _c;
                                if (foundStatus) {
                                    // A grpc-status: 0 response header was present. This is a "trailers-only"
                                    // response (a response without a body and no trailers).
                                    //
                                    // The spec seems to disallow a trailers-only response for status 0 - we are
                                    // lenient and only verify that the body is empty.
                                    //
                                    // > [...] Trailers-Only is permitted for calls that produce an immediate error.
                                    // See https://github.com/grpc/grpc/blob/master/doc/PROTOCOL-HTTP2.md
                                    const r = yield __await(iterable[Symbol.asyncIterator]().next());
                                    if (r.done !== true) {
                                        throw new connect_error_js_1.ConnectError("protocol error: extra data for trailers-only", code_js_1.Code.InvalidArgument);
                                    }
                                    return yield __await(void 0);
                                }
                                let trailerReceived = false;
                                try {
                                    for (var _d = true, iterable_2 = __asyncValues(iterable), iterable_2_1; iterable_2_1 = yield __await(iterable_2.next()), _a = iterable_2_1.done, !_a; _d = true) {
                                        _c = iterable_2_1.value;
                                        _d = false;
                                        const chunk = _c;
                                        if (chunk.end) {
                                            if (trailerReceived) {
                                                throw new connect_error_js_1.ConnectError("protocol error: received extra trailer", code_js_1.Code.InvalidArgument);
                                            }
                                            trailerReceived = true;
                                            (0, validate_trailer_js_1.validateTrailer)(chunk.value, uRes.header);
                                            chunk.value.forEach((value, key) => res.trailer.set(key, value));
                                            continue;
                                        }
                                        if (trailerReceived) {
                                            throw new connect_error_js_1.ConnectError("protocol error: received extra message after trailer", code_js_1.Code.InvalidArgument);
                                        }
                                        yield yield __await(chunk.value);
                                    }
                                }
                                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                                finally {
                                    try {
                                        if (!_d && !_a && (_b = iterable_2.return)) yield __await(_b.call(iterable_2));
                                    }
                                    finally { if (e_2) throw e_2.error; }
                                }
                                if (!trailerReceived) {
                                    throw new connect_error_js_1.ConnectError("protocol error: missing trailer", code_js_1.Code.Internal);
                                }
                            });
                        }, { propagateDownStreamError: true }) });
                    return res;
                },
            });
        },
    };
}
