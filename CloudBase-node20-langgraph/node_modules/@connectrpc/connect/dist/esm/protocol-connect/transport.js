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
import { requestHeaderWithCompression } from "./request-header.js";
import { headerUnaryContentLength, headerUnaryEncoding } from "./headers.js";
import { validateResponseWithCompression } from "./validate-response.js";
import { trailerDemux } from "./trailer-mux.js";
import { errorFromJsonBytes } from "./error-json.js";
import { createEndStreamSerialization, endStreamFlag } from "./end-stream.js";
import { transformConnectPostToGetRequest } from "./get-request.js";
import { Code } from "../code.js";
import { ConnectError } from "../connect-error.js";
import { appendHeaders } from "../http-headers.js";
import { createAsyncIterable, pipeTo, sinkAllBytes, pipe, transformSerializeEnvelope, transformCompressEnvelope, transformJoinEnvelopes, transformSplitEnvelope, transformDecompressEnvelope, transformParseEnvelope, } from "../protocol/async-iterable.js";
import { createMethodUrl } from "../protocol/create-method-url.js";
import { runUnaryCall, runStreamingCall } from "../protocol/run-call.js";
import { createMethodSerializationLookup } from "../protocol/serialization.js";
import { createContextValues } from "../context-values.js";
import { MethodOptions_IdempotencyLevel } from "@bufbuild/protobuf/wkt";
/**
 * Create a Transport for the Connect protocol.
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
                    header: requestHeaderWithCompression(method.methodKind, opt.useBinaryFormat, timeoutMs, header, opt.acceptCompression, opt.sendCompression, true),
                    contextValues: contextValues !== null && contextValues !== void 0 ? contextValues : createContextValues(),
                    message,
                },
                next: async (req) => {
                    let requestBody = serialization
                        .getI(opt.useBinaryFormat)
                        .serialize(req.message);
                    if (opt.sendCompression &&
                        requestBody.byteLength > opt.compressMinBytes) {
                        requestBody = await opt.sendCompression.compress(requestBody);
                        req.header.set(headerUnaryEncoding, opt.sendCompression.name);
                    }
                    else {
                        req.header.delete(headerUnaryEncoding);
                    }
                    const useGet = opt.useHttpGet === true &&
                        method.idempotency ===
                            MethodOptions_IdempotencyLevel.NO_SIDE_EFFECTS;
                    let body;
                    if (useGet) {
                        req = transformConnectPostToGetRequest(req, requestBody, opt.useBinaryFormat);
                    }
                    else {
                        body = createAsyncIterable([requestBody]);
                    }
                    const universalResponse = await opt.httpClient({
                        url: req.url,
                        method: req.requestMethod,
                        header: req.header,
                        signal: req.signal,
                        body,
                    });
                    const { compression, isUnaryError, unaryError } = validateResponseWithCompression(method.methodKind, opt.acceptCompression, opt.useBinaryFormat, universalResponse.status, universalResponse.header);
                    const [header, trailer] = trailerDemux(universalResponse.header);
                    let responseBody = await pipeTo(universalResponse.body, sinkAllBytes(opt.readMaxBytes, universalResponse.header.get(headerUnaryContentLength)), { propagateDownStreamError: false });
                    if (compression) {
                        responseBody = await compression.decompress(responseBody, opt.readMaxBytes);
                    }
                    if (isUnaryError) {
                        throw errorFromJsonBytes(responseBody, appendHeaders(header, trailer), unaryError);
                    }
                    return {
                        stream: false,
                        service: method.parent,
                        method,
                        header,
                        message: serialization
                            .getO(opt.useBinaryFormat)
                            .parse(responseBody),
                        trailer,
                    };
                },
            });
        },
        async stream(method, signal, timeoutMs, header, input, contextValues) {
            const serialization = createMethodSerializationLookup(method, opt.binaryOptions, opt.jsonOptions, opt);
            const endStreamSerialization = createEndStreamSerialization(opt.jsonOptions);
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
                    header: requestHeaderWithCompression(method.methodKind, opt.useBinaryFormat, timeoutMs, header, opt.acceptCompression, opt.sendCompression, true),
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
                    const { compression } = validateResponseWithCompression(method.methodKind, opt.acceptCompression, opt.useBinaryFormat, uRes.status, uRes.header);
                    const res = Object.assign(Object.assign({}, req), { header: uRes.header, trailer: new Headers(), message: pipe(uRes.body, transformSplitEnvelope(opt.readMaxBytes), transformDecompressEnvelope(compression !== null && compression !== void 0 ? compression : null, opt.readMaxBytes), transformParseEnvelope(serialization.getO(opt.useBinaryFormat), endStreamFlag, endStreamSerialization), function (iterable) {
                            return __asyncGenerator(this, arguments, function* () {
                                var _a, e_1, _b, _c;
                                let endStreamReceived = false;
                                try {
                                    for (var _d = true, iterable_1 = __asyncValues(iterable), iterable_1_1; iterable_1_1 = yield __await(iterable_1.next()), _a = iterable_1_1.done, !_a; _d = true) {
                                        _c = iterable_1_1.value;
                                        _d = false;
                                        const chunk = _c;
                                        if (chunk.end) {
                                            if (endStreamReceived) {
                                                throw new ConnectError("protocol error: received extra EndStreamResponse", Code.InvalidArgument);
                                            }
                                            endStreamReceived = true;
                                            if (chunk.value.error) {
                                                const error = chunk.value.error;
                                                uRes.header.forEach((value, key) => {
                                                    error.metadata.append(key, value);
                                                });
                                                throw error;
                                            }
                                            chunk.value.metadata.forEach((value, key) => res.trailer.set(key, value));
                                            continue;
                                        }
                                        if (endStreamReceived) {
                                            throw new ConnectError("protocol error: received extra message after EndStreamResponse", Code.InvalidArgument);
                                        }
                                        yield yield __await(chunk.value);
                                    }
                                }
                                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                                finally {
                                    try {
                                        if (!_d && !_a && (_b = iterable_1.return)) yield __await(_b.call(iterable_1));
                                    }
                                    finally { if (e_1) throw e_1.error; }
                                }
                                if (!endStreamReceived) {
                                    throw new ConnectError("protocol error: missing EndStreamResponse", Code.InvalidArgument);
                                }
                            });
                        }, { propagateDownStreamError: true }) });
                    return res;
                },
            });
        },
    };
}
