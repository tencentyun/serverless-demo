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
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
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
import { requestHeaderWithCompression } from "./request-header.js";
import { validateResponseWithCompression } from "./validate-response.js";
import { validateTrailer } from "./validate-trailer.js";
import { Code } from "../code.js";
import { ConnectError } from "../connect-error.js";
import { pipe, createAsyncIterable, transformSerializeEnvelope, transformCompressEnvelope, transformJoinEnvelopes, pipeTo, transformSplitEnvelope, transformDecompressEnvelope, transformParseEnvelope, } from "../protocol/async-iterable.js";
import { createMethodUrl } from "../protocol/create-method-url.js";
import { runUnaryCall, runStreamingCall } from "../protocol/run-call.js";
import { createMethodSerializationLookup } from "../protocol/serialization.js";
import { createContextValues } from "../context-values.js";
import { headerGrpcStatus } from "./headers.js";
/**
 * Create a Transport for the gRPC protocol.
 */
export function createTransport(opt) {
    return {
        async unary(method, signal, timeoutMs, header, message, contextValues) {
            const serialization = createMethodSerializationLookup(method, opt.binaryOptions, opt.jsonOptions, opt);
            timeoutMs =
                timeoutMs === undefined
                    ? opt.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return await runUnaryCall({
                interceptors: opt.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: false,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: createMethodUrl(opt.baseUrl, method),
                    header: requestHeaderWithCompression(opt.useBinaryFormat, timeoutMs, header, opt.acceptCompression, opt.sendCompression),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : createContextValues(),
                    message,
                },
                next: async (req) => {
                    const uRes = await opt.httpClient({
                        url: req.url,
                        method: "POST",
                        header: req.header,
                        signal: req.signal,
                        body: pipe(createAsyncIterable([req.message]), transformSerializeEnvelope(serialization.getI(opt.useBinaryFormat)), transformCompressEnvelope(opt.sendCompression, opt.compressMinBytes), transformJoinEnvelopes(), {
                            propagateDownStreamError: true,
                        }),
                    });
                    const { compression, headerError } = validateResponseWithCompression(opt.acceptCompression, uRes.status, uRes.header);
                    const message = await pipeTo(uRes.body, transformSplitEnvelope(opt.readMaxBytes), transformDecompressEnvelope(compression !== null && compression !== void 0 ? compression : null, opt.readMaxBytes), transformParseEnvelope(serialization.getO(opt.useBinaryFormat)), async (iterable) => {
                        var _a, e_1, _b, _c;
                        let message;
                        try {
                            for (var _d = true, iterable_1 = __asyncValues(iterable), iterable_1_1; iterable_1_1 = await iterable_1.next(), _a = iterable_1_1.done, !_a; _d = true) {
                                _c = iterable_1_1.value;
                                _d = false;
                                const chunk = _c;
                                if (message !== undefined) {
                                    throw new ConnectError("protocol error: received extra output message for unary method", Code.Unimplemented);
                                }
                                message = chunk;
                            }
                        }
                        catch (e_1_1) { e_1 = { error: e_1_1 }; }
                        finally {
                            try {
                                if (!_d && !_a && (_b = iterable_1.return)) await _b.call(iterable_1);
                            }
                            finally { if (e_1) throw e_1.error; }
                        }
                        return message;
                    }, { propagateDownStreamError: false });
                    validateTrailer(uRes.trailer, uRes.header);
                    if (message === undefined) {
                        // Trailers only response
                        if (headerError) {
                            throw headerError;
                        }
                        throw new ConnectError("protocol error: missing output message for unary method", uRes.trailer.has(headerGrpcStatus)
                            ? Code.Unimplemented
                            : Code.Unknown);
                    }
                    if (headerError) {
                        throw new ConnectError("protocol error: received output message for unary method with error status", Code.Unknown);
                    }
                    return {
                        stream: false,
                        service: method.parent,
                        method,
                        header: uRes.header,
                        message,
                        trailer: uRes.trailer,
                    };
                },
            });
        },
        async stream(method, signal, timeoutMs, header, input, contextValues) {
            const serialization = createMethodSerializationLookup(method, opt.binaryOptions, opt.jsonOptions, opt);
            timeoutMs =
                timeoutMs === undefined
                    ? opt.defaultTimeoutMs
                    : timeoutMs <= 0
                        ? undefined
                        : timeoutMs;
            return runStreamingCall({
                interceptors: opt.interceptors,
                signal,
                timeoutMs,
                req: {
                    stream: true,
                    service: method.parent,
                    method,
                    requestMethod: "POST",
                    url: createMethodUrl(opt.baseUrl, method),
                    header: requestHeaderWithCompression(opt.useBinaryFormat, timeoutMs, header, opt.acceptCompression, opt.sendCompression),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : createContextValues(),
                    message: input,
                },
                next: async (req) => {
                    const uRes = await opt.httpClient({
                        url: req.url,
                        method: "POST",
                        header: req.header,
                        signal: req.signal,
                        body: pipe(req.message, transformSerializeEnvelope(serialization.getI(opt.useBinaryFormat)), transformCompressEnvelope(opt.sendCompression, opt.compressMinBytes), transformJoinEnvelopes(), { propagateDownStreamError: true }),
                    });
                    const { compression, foundStatus, headerError } = validateResponseWithCompression(opt.acceptCompression, uRes.status, uRes.header);
                    if (headerError) {
                        throw headerError;
                    }
                    const res = Object.assign(Object.assign({}, req), { header: uRes.header, trailer: uRes.trailer, message: pipe(uRes.body, transformSplitEnvelope(opt.readMaxBytes), transformDecompressEnvelope(compression !== null && compression !== void 0 ? compression : null, opt.readMaxBytes), transformParseEnvelope(serialization.getO(opt.useBinaryFormat)), function (iterable) {
                            return __asyncGenerator(this, arguments, function* () {
                                yield __await(yield* __asyncDelegator(__asyncValues(iterable)));
                                if (!foundStatus) {
                                    validateTrailer(uRes.trailer, uRes.header);
                                }
                            });
                        }, { propagateDownStreamError: true }) });
                    return res;
                },
            });
        },
    };
}
