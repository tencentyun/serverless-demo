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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
import { ConnectError } from "../connect-error.js";
import { Code } from "../code.js";
import { createAsyncIterable } from "./async-iterable.js";
import { normalize, normalizeIterable } from "./normalize.js";
import { applyInterceptors } from "../interceptor.js";
/**
 * Invoke a user-provided implementation of a unary RPC. Returns a normalized
 * output message.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export async function invokeUnaryImplementation(spec, context, input, interceptors) {
    const anyFn = async (req) => {
        return Object.assign({ message: normalize(spec.method.output, await spec.impl(req.message, mergeRequest(context, req))), stream: false, method: spec.method }, responseCommon(context, spec));
    };
    const next = applyInterceptors(anyFn, interceptors);
    const { message, header, trailer } = await next(Object.assign({ stream: false, message: input, method: spec.method }, requestCommon(context, spec)));
    copyHeaders(header, context.responseHeader);
    copyHeaders(trailer, context.responseTrailer);
    return message;
}
/**
 * Return an AsyncIterableTransform that invokes a user-provided implementation,
 * giving it input from an asynchronous iterable, and returning its output as an
 * asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function transformInvokeImplementation(spec, context, interceptors) {
    switch (spec.kind) {
        case "unary":
            return function unary(input) {
                return __asyncGenerator(this, arguments, function* unary_1() {
                    yield yield __await(yield __await(invokeUnaryImplementation(spec, context, yield __await(ensureSingle(input, "unary")), interceptors)));
                });
            };
        case "server_streaming": {
            return function serverStreaming(input) {
                return invokeStreamImplementation(spec, context, input, interceptors, async (req) => {
                    const output = normalizeIterable(spec.method.output, spec.impl(await ensureSingle(input, "server-streaming"), mergeRequest(context, req)));
                    return Object.assign({ stream: true, message: output, method: spec.method }, responseCommon(context, spec));
                });
            };
        }
        case "client_streaming": {
            return function clientStreaming(input) {
                return invokeStreamImplementation(spec, context, input, interceptors, async (req) => {
                    return Object.assign({ message: createAsyncIterable([
                            normalize(spec.method.output, await spec.impl(req.message, mergeRequest(context, req))),
                        ]), stream: true, method: spec.method }, responseCommon(context, spec));
                });
            };
        }
        case "bidi_streaming":
            return function biDiStreaming(input) {
                return invokeStreamImplementation(spec, context, input, interceptors, (req) => {
                    return Promise.resolve(Object.assign({ message: normalizeIterable(spec.method.output, spec.impl(req.message, mergeRequest(context, req))), stream: true, method: spec.method }, responseCommon(context, spec)));
                });
            };
    }
}
function invokeStreamImplementation(spec, context, input, interceptors, anyFn) {
    return __asyncGenerator(this, arguments, function* invokeStreamImplementation_1() {
        const next = applyInterceptors(anyFn, interceptors);
        const { message, header, trailer } = yield __await(next(Object.assign({ stream: true, message: input, method: spec.method }, requestCommon(context, spec))));
        copyHeaders(header, context.responseHeader);
        yield __await(yield* __asyncDelegator(__asyncValues(message)));
        copyHeaders(trailer, context.responseTrailer);
    });
}
async function ensureSingle(iterable, method) {
    const it = iterable[Symbol.asyncIterator]();
    const first = await it.next();
    if (first.done === true) {
        throw new ConnectError(`protocol error: missing input message for ${method} method`, Code.Unimplemented);
    }
    const second = await it.next();
    if (second.done !== true) {
        throw new ConnectError(`protocol error: received extra input message for ${method} method`, Code.Unimplemented);
    }
    return first.value;
}
function requestCommon(context, spec) {
    return {
        requestMethod: context.requestMethod,
        url: context.url,
        signal: context.signal,
        header: context.requestHeader,
        service: spec.method.parent,
        contextValues: context.values,
    };
}
function responseCommon(context, spec) {
    return {
        service: spec.method.parent,
        header: context.responseHeader,
        trailer: context.responseTrailer,
    };
}
function mergeRequest(context, req) {
    return Object.assign(Object.assign({}, context), { service: req.service, requestHeader: req.header, signal: req.signal, values: req.contextValues });
}
function copyHeaders(from, to) {
    if (from === to) {
        return;
    }
    to.forEach((_, key) => {
        to.delete(key);
    });
    from.forEach((value, key) => {
        to.set(key, value);
    });
}
