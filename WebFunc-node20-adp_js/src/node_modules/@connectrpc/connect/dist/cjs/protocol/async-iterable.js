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
var __asyncDelegator = (this && this.__asyncDelegator) || function (o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pipeTo = pipeTo;
exports.sinkAll = sinkAll;
exports.sinkAllBytes = sinkAllBytes;
exports.pipe = pipe;
exports.transformCatch = transformCatch;
exports.transformCatchFinally = transformCatchFinally;
exports.transformAppend = transformAppend;
exports.transformPrepend = transformPrepend;
exports.transformReadAllBytes = transformReadAllBytes;
exports.transformSerializeEnvelope = transformSerializeEnvelope;
exports.transformParseEnvelope = transformParseEnvelope;
exports.transformCompressEnvelope = transformCompressEnvelope;
exports.transformDecompressEnvelope = transformDecompressEnvelope;
exports.transformJoinEnvelopes = transformJoinEnvelopes;
exports.transformSplitEnvelope = transformSplitEnvelope;
exports.readAllBytes = readAllBytes;
exports.untilFirst = untilFirst;
exports.makeIterableAbortable = makeIterableAbortable;
exports.createWritableIterable = createWritableIterable;
exports.createAsyncIterable = createAsyncIterable;
const code_js_1 = require("../code.js");
const connect_error_js_1 = require("../connect-error.js");
const envelope_js_1 = require("./envelope.js");
const limit_io_js_1 = require("./limit-io.js");
function pipeTo(source, ...rest) {
    const [transforms, sink, opt] = pickTransformsAndSink(rest);
    let iterable = source;
    let abortable;
    if ((opt === null || opt === void 0 ? void 0 : opt.propagateDownStreamError) === true) {
        iterable = abortable = makeIterableAbortable(iterable);
    }
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    iterable = pipe(iterable, ...transforms, { propagateDownStreamError: false });
    return sink(iterable).catch((reason) => {
        if (abortable) {
            return abortable.abort(reason).then(() => Promise.reject(reason));
        }
        return Promise.reject(reason);
    });
}
// pick transforms, the sink, and options from the pipeTo() rest parameter
function pickTransformsAndSink(rest) {
    let opt;
    if (typeof rest[rest.length - 1] != "function") {
        opt = rest.pop();
    }
    const sink = rest.pop();
    return [rest, sink, opt];
}
/**
 * Creates an AsyncIterableSink that concatenates all elements from the input.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function sinkAll() {
    return async function (iterable) {
        var _a, e_1, _b, _c;
        const all = [];
        try {
            for (var _d = true, iterable_1 = __asyncValues(iterable), iterable_1_1; iterable_1_1 = await iterable_1.next(), _a = iterable_1_1.done, !_a; _d = true) {
                _c = iterable_1_1.value;
                _d = false;
                const chunk = _c;
                all.push(chunk);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = iterable_1.return)) await _b.call(iterable_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return all;
    };
}
/**
 * Creates an AsyncIterableSink that concatenates all chunks from the input into
 * a single Uint8Array.
 *
 * The iterable raises an error if the more than readMaxBytes are read.
 *
 * An optional length hint can be provided to optimize allocation and validation.
 * If more or less bytes are present in the source that the length hint indicates,
 * and error is raised.
 * If the length hint is larger than readMaxBytes, an error is raised.
 * If the length hint is not a positive integer, it is ignored.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function sinkAllBytes(readMaxBytes, lengthHint) {
    return async function (iterable) {
        return await readAllBytes(iterable, readMaxBytes, lengthHint);
    };
}
function pipe(source, ...rest) {
    return __asyncGenerator(this, arguments, function* pipe_1() {
        var _a;
        const [transforms, opt] = pickTransforms(rest);
        let abortable;
        const sourceIt = source[Symbol.asyncIterator]();
        const cachedSource = {
            [Symbol.asyncIterator]() {
                return sourceIt;
            },
        };
        let iterable = cachedSource;
        if ((opt === null || opt === void 0 ? void 0 : opt.propagateDownStreamError) === true) {
            iterable = abortable = makeIterableAbortable(iterable);
        }
        for (const t of transforms) {
            iterable = t(iterable);
        }
        const it = iterable[Symbol.asyncIterator]();
        try {
            for (;;) {
                const r = yield __await(it.next());
                if (r.done === true) {
                    break;
                }
                if (!abortable) {
                    yield yield __await(r.value);
                    continue;
                }
                try {
                    yield yield __await(r.value);
                }
                catch (e) {
                    yield __await(abortable.abort(e)); // propagate downstream error to the source
                    throw e;
                }
            }
        }
        finally {
            if ((opt === null || opt === void 0 ? void 0 : opt.propagateDownStreamError) === true) {
                // Call return on the source iterable to indicate
                // that we will no longer consume it and it should
                // cleanup any allocated resources.
                (_a = sourceIt.return) === null || _a === void 0 ? void 0 : _a.call(sourceIt).catch(() => {
                    // return returns a promise, which we don't care about.
                    //
                    // Uncaught promises are thrown at sometime/somewhere by the event loop,
                    // this is to ensure error is caught and ignored.
                });
            }
        }
    });
}
function pickTransforms(rest) {
    let opt;
    if (typeof rest[rest.length - 1] != "function") {
        opt = rest.pop();
    }
    return [rest, opt];
}
/**
 * Creates an AsyncIterableTransform that catches any error from the input, and
 * passes it to the given catchError function.
 *
 * The catchError function may return a final value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformCatch(catchError) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            // we deliberate avoid a for-await loop because we only want to catch upstream
            // errors, not downstream errors (yield).
            const it = iterable[Symbol.asyncIterator]();
            for (;;) {
                let r;
                try {
                    r = yield __await(it.next());
                }
                catch (e) {
                    const caught = yield __await(catchError(e));
                    if (caught !== undefined) {
                        yield yield __await(caught);
                    }
                    break;
                }
                if (r.done === true) {
                    break;
                }
                yield yield __await(r.value);
            }
        });
    };
}
/**
 * Creates an AsyncIterableTransform that catches any error from the input, and
 * passes it to the given function. Unlike transformCatch(), the given function
 * is also called when no error is raised.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformCatchFinally(catchFinally) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            // we deliberate avoid a for-await loop because we only want to catch upstream
            // errors, not downstream errors (yield).
            let err;
            const it = iterable[Symbol.asyncIterator]();
            for (;;) {
                let r;
                try {
                    r = yield __await(it.next());
                }
                catch (e) {
                    err = e;
                    break;
                }
                if (r.done === true) {
                    break;
                }
                yield yield __await(r.value);
            }
            const caught = yield __await(catchFinally(err));
            if (caught !== undefined) {
                yield yield __await(caught);
            }
        });
    };
}
/**
 * Creates an AsyncIterableTransform that appends a value.
 *
 * The element to append is provided by a function. If the function returns
 * undefined, no element is appended.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformAppend(provide) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_2, _b, _c;
            try {
                for (var _d = true, iterable_2 = __asyncValues(iterable), iterable_2_1; iterable_2_1 = yield __await(iterable_2.next()), _a = iterable_2_1.done, !_a; _d = true) {
                    _c = iterable_2_1.value;
                    _d = false;
                    const chunk = _c;
                    yield yield __await(chunk);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_2.return)) yield __await(_b.call(iterable_2));
                }
                finally { if (e_2) throw e_2.error; }
            }
            const append = yield __await(provide());
            if (append !== undefined) {
                yield yield __await(append);
            }
        });
    };
}
/**
 * Creates an AsyncIterableTransform that prepends an element.
 *
 * The element to prepend is provided by a function. If the function returns
 * undefined, no element is appended.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformPrepend(provide) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_3, _b, _c;
            const prepend = yield __await(provide());
            if (prepend !== undefined) {
                yield yield __await(prepend);
            }
            try {
                for (var _d = true, iterable_3 = __asyncValues(iterable), iterable_3_1; iterable_3_1 = yield __await(iterable_3.next()), _a = iterable_3_1.done, !_a; _d = true) {
                    _c = iterable_3_1.value;
                    _d = false;
                    const chunk = _c;
                    yield yield __await(chunk);
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_3.return)) yield __await(_b.call(iterable_3));
                }
                finally { if (e_3) throw e_3.error; }
            }
        });
    };
}
/**
 * Creates an AsyncIterableTransform that reads all bytes from the input, and
 * concatenates them to a single Uint8Array.
 *
 * The iterable raises an error if the more than readMaxBytes are read.
 *
 * An optional length hint can be provided to optimize allocation and validation.
 * If more or less bytes are present in the source that the length hint indicates,
 * and error is raised.
 * If the length hint is larger than readMaxBytes, an error is raised.
 * If the length hint is not a positive integer, it is ignored.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformReadAllBytes(readMaxBytes, lengthHint) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            yield yield __await(yield __await(readAllBytes(iterable, readMaxBytes, lengthHint)));
        });
    };
}
function transformSerializeEnvelope(serialization, endStreamFlag, endSerialization) {
    if (endStreamFlag === undefined || endSerialization === undefined) {
        return function (iterable) {
            return __asyncGenerator(this, arguments, function* () {
                var _a, e_4, _b, _c;
                try {
                    for (var _d = true, iterable_4 = __asyncValues(iterable), iterable_4_1; iterable_4_1 = yield __await(iterable_4.next()), _a = iterable_4_1.done, !_a; _d = true) {
                        _c = iterable_4_1.value;
                        _d = false;
                        const chunk = _c;
                        const data = serialization.serialize(chunk);
                        yield yield __await({ flags: 0, data });
                    }
                }
                catch (e_4_1) { e_4 = { error: e_4_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = iterable_4.return)) yield __await(_b.call(iterable_4));
                    }
                    finally { if (e_4) throw e_4.error; }
                }
            });
        };
    }
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_5, _b, _c;
            try {
                for (var _d = true, iterable_5 = __asyncValues(iterable), iterable_5_1; iterable_5_1 = yield __await(iterable_5.next()), _a = iterable_5_1.done, !_a; _d = true) {
                    _c = iterable_5_1.value;
                    _d = false;
                    const chunk = _c;
                    let data;
                    let flags = 0;
                    if (chunk.end) {
                        flags = flags | endStreamFlag;
                        data = endSerialization.serialize(chunk.value);
                    }
                    else {
                        data = serialization.serialize(chunk.value);
                    }
                    yield yield __await({ flags, data });
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_5.return)) yield __await(_b.call(iterable_5));
                }
                finally { if (e_5) throw e_5.error; }
            }
        });
    };
}
function transformParseEnvelope(serialization, endStreamFlag, endSerialization) {
    // code path always yields ParsedEnvelopedMessage<T, E>
    if (endSerialization && endStreamFlag !== undefined) {
        return function (iterable) {
            return __asyncGenerator(this, arguments, function* () {
                var _a, e_6, _b, _c;
                try {
                    for (var _d = true, iterable_6 = __asyncValues(iterable), iterable_6_1; iterable_6_1 = yield __await(iterable_6.next()), _a = iterable_6_1.done, !_a; _d = true) {
                        _c = iterable_6_1.value;
                        _d = false;
                        const { flags, data } = _c;
                        if ((flags & endStreamFlag) === endStreamFlag) {
                            yield yield __await({ value: endSerialization.parse(data), end: true });
                        }
                        else {
                            yield yield __await({ value: serialization.parse(data), end: false });
                        }
                    }
                }
                catch (e_6_1) { e_6 = { error: e_6_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = iterable_6.return)) yield __await(_b.call(iterable_6));
                    }
                    finally { if (e_6) throw e_6.error; }
                }
            });
        };
    }
    // code path always yields T
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_7, _b, _c;
            try {
                for (var _d = true, iterable_7 = __asyncValues(iterable), iterable_7_1; iterable_7_1 = yield __await(iterable_7.next()), _a = iterable_7_1.done, !_a; _d = true) {
                    _c = iterable_7_1.value;
                    _d = false;
                    const { flags, data } = _c;
                    if (endStreamFlag !== undefined &&
                        (flags & endStreamFlag) === endStreamFlag) {
                        if (endSerialization === null) {
                            throw new connect_error_js_1.ConnectError("unexpected end flag", code_js_1.Code.InvalidArgument);
                        }
                        // skips end-of-stream envelope
                        continue;
                    }
                    yield yield __await(serialization.parse(data));
                }
            }
            catch (e_7_1) { e_7 = { error: e_7_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_7.return)) yield __await(_b.call(iterable_7));
                }
                finally { if (e_7) throw e_7.error; }
            }
        });
    };
}
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as a source,
 * and compresses them if they are larger than compressMinBytes.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformCompressEnvelope(compression, compressMinBytes) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_8, _b, _c;
            try {
                for (var _d = true, iterable_8 = __asyncValues(iterable), iterable_8_1; iterable_8_1 = yield __await(iterable_8.next()), _a = iterable_8_1.done, !_a; _d = true) {
                    _c = iterable_8_1.value;
                    _d = false;
                    const env = _c;
                    yield yield __await(yield __await((0, envelope_js_1.envelopeCompress)(env, compression, compressMinBytes)));
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_8.return)) yield __await(_b.call(iterable_8));
                }
                finally { if (e_8) throw e_8.error; }
            }
        });
    };
}
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as a source,
 * and decompresses them using the given compression.
 *
 * The iterable raises an error if the decompressed payload of an enveloped
 * message is larger than readMaxBytes, or if no compression is provided.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformDecompressEnvelope(compression, readMaxBytes) {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_9, _b, _c;
            try {
                for (var _d = true, iterable_9 = __asyncValues(iterable), iterable_9_1; iterable_9_1 = yield __await(iterable_9.next()), _a = iterable_9_1.done, !_a; _d = true) {
                    _c = iterable_9_1.value;
                    _d = false;
                    const env = _c;
                    yield yield __await(yield __await((0, envelope_js_1.envelopeDecompress)(env, compression, readMaxBytes)));
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_9.return)) yield __await(_b.call(iterable_9));
                }
                finally { if (e_9) throw e_9.error; }
            }
        });
    };
}
/**
 * Create an AsyncIterableTransform that takes enveloped messages as a source,
 * and joins them into a stream of raw bytes.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformJoinEnvelopes() {
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_10, _b, _c;
            try {
                for (var _d = true, iterable_10 = __asyncValues(iterable), iterable_10_1; iterable_10_1 = yield __await(iterable_10.next()), _a = iterable_10_1.done, !_a; _d = true) {
                    _c = iterable_10_1.value;
                    _d = false;
                    const { flags, data } = _c;
                    yield yield __await((0, envelope_js_1.encodeEnvelope)(flags, data));
                }
            }
            catch (e_10_1) { e_10 = { error: e_10_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_10.return)) yield __await(_b.call(iterable_10));
                }
                finally { if (e_10) throw e_10.error; }
            }
        });
    };
}
/**
 * Create an AsyncIterableTransform that takes raw bytes as a source, and splits
 * them into enveloped messages.
 *
 * The iterable raises an error
 * - if the payload of an enveloped message is larger than readMaxBytes,
 * - if the stream ended before an enveloped message fully arrived,
 * - or if the stream ended with extraneous data.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function transformSplitEnvelope(readMaxBytes) {
    // append chunk to buffer, returning updated buffer
    function append(buffer, chunk) {
        const n = new Uint8Array(buffer.byteLength + chunk.byteLength);
        n.set(buffer);
        n.set(chunk, buffer.length);
        return n;
    }
    // tuple 0: envelope, or undefined if incomplete
    // tuple 1: remainder of the buffer
    function shiftEnvelope(buffer, header) {
        if (buffer.byteLength < 5 + header.length) {
            return [undefined, buffer];
        }
        return [
            { flags: header.flags, data: buffer.subarray(5, 5 + header.length) },
            buffer.subarray(5 + header.length),
        ];
    }
    // undefined: header is incomplete
    function peekHeader(buffer) {
        if (buffer.byteLength < 5) {
            return undefined;
        }
        const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        const length = view.getUint32(1); // 4 bytes message length
        const flags = view.getUint8(0); // first byte is flags
        return { length, flags };
    }
    return function (iterable) {
        return __asyncGenerator(this, arguments, function* () {
            var _a, e_11, _b, _c;
            let buffer = new Uint8Array(0);
            try {
                for (var _d = true, iterable_11 = __asyncValues(iterable), iterable_11_1; iterable_11_1 = yield __await(iterable_11.next()), _a = iterable_11_1.done, !_a; _d = true) {
                    _c = iterable_11_1.value;
                    _d = false;
                    const chunk = _c;
                    buffer = append(buffer, chunk);
                    for (;;) {
                        const header = peekHeader(buffer);
                        if (!header) {
                            break;
                        }
                        (0, limit_io_js_1.assertReadMaxBytes)(readMaxBytes, header.length, true);
                        let env;
                        [env, buffer] = shiftEnvelope(buffer, header);
                        if (!env) {
                            break;
                        }
                        yield yield __await(env);
                    }
                }
            }
            catch (e_11_1) { e_11 = { error: e_11_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = iterable_11.return)) yield __await(_b.call(iterable_11));
                }
                finally { if (e_11) throw e_11.error; }
            }
            if (buffer.byteLength > 0) {
                const header = peekHeader(buffer);
                let message = "protocol error: incomplete envelope";
                if (header) {
                    message = `protocol error: promised ${header.length} bytes in enveloped message, got ${buffer.byteLength - 5} bytes`;
                }
                throw new connect_error_js_1.ConnectError(message, code_js_1.Code.InvalidArgument);
            }
        });
    };
}
/**
 * Reads all bytes from the source, and concatenates them to a single Uint8Array.
 *
 * Raises an error if:
 * - more than readMaxBytes are read
 * - lengthHint is a positive integer, but larger than readMaxBytes
 * - lengthHint is a positive integer, and the source contains more or less bytes
 *   than promised
 *
 * @private Internal code, does not follow semantic versioning.
 */
async function readAllBytes(iterable, readMaxBytes, lengthHint) {
    var _a, e_12, _b, _c, _d, e_13, _e, _f;
    const [ok, hint] = parseLengthHint(lengthHint);
    if (ok) {
        if (hint > readMaxBytes) {
            (0, limit_io_js_1.assertReadMaxBytes)(readMaxBytes, hint, true);
        }
        const buffer = new Uint8Array(hint);
        let offset = 0;
        try {
            for (var _g = true, iterable_12 = __asyncValues(iterable), iterable_12_1; iterable_12_1 = await iterable_12.next(), _a = iterable_12_1.done, !_a; _g = true) {
                _c = iterable_12_1.value;
                _g = false;
                const chunk = _c;
                if (offset + chunk.byteLength > hint) {
                    throw new connect_error_js_1.ConnectError(`protocol error: promised ${hint} bytes, received ${offset + chunk.byteLength}`, code_js_1.Code.InvalidArgument);
                }
                buffer.set(chunk, offset);
                offset += chunk.byteLength;
            }
        }
        catch (e_12_1) { e_12 = { error: e_12_1 }; }
        finally {
            try {
                if (!_g && !_a && (_b = iterable_12.return)) await _b.call(iterable_12);
            }
            finally { if (e_12) throw e_12.error; }
        }
        if (offset < hint) {
            throw new connect_error_js_1.ConnectError(`protocol error: promised ${hint} bytes, received ${offset}`, code_js_1.Code.InvalidArgument);
        }
        return buffer;
    }
    const chunks = [];
    let count = 0;
    try {
        for (var _h = true, iterable_13 = __asyncValues(iterable), iterable_13_1; iterable_13_1 = await iterable_13.next(), _d = iterable_13_1.done, !_d; _h = true) {
            _f = iterable_13_1.value;
            _h = false;
            const chunk = _f;
            count += chunk.byteLength;
            (0, limit_io_js_1.assertReadMaxBytes)(readMaxBytes, count);
            chunks.push(chunk);
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (!_h && !_d && (_e = iterable_13.return)) await _e.call(iterable_13);
        }
        finally { if (e_13) throw e_13.error; }
    }
    const all = new Uint8Array(count);
    let offset = 0;
    for (let chunk = chunks.shift(); chunk; chunk = chunks.shift()) {
        all.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return all;
}
// parse the lengthHint argument of readAllBytes()
function parseLengthHint(lengthHint) {
    if (lengthHint === undefined || lengthHint === null) {
        return [false, 0];
    }
    const n = typeof lengthHint == "string" ? parseInt(lengthHint, 10) : lengthHint;
    if (!Number.isSafeInteger(n) || n < 0) {
        return [false, n];
    }
    return [true, n];
}
/**
 * Wait for the first element of an iterable without modifying the iterable.
 * This consumes the first element, but pushes it back on the stack.
 *
 * @private Internal code, does not follow semantic versioning.
 */
async function untilFirst(iterable) {
    const it = iterable[Symbol.asyncIterator]();
    let first = await it.next();
    return {
        [Symbol.asyncIterator]() {
            const w = {
                async next() {
                    if (first !== null) {
                        const n = first;
                        first = null;
                        return n;
                    }
                    return await it.next();
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
}
/**
 * Wrap the given iterable and return an iterable with an abort() method.
 *
 * This function exists purely for convenience. Where one would typically have
 * to access the iterator directly, advance through all elements, and call
 * AsyncIterator.throw() to notify the upstream iterable, this function allows
 * to use convenient for-await loops and still notify the upstream iterable:
 *
 * ```ts
 * const abortable = makeIterableAbortable(iterable);
 * for await (const ele of abortable) {
 *   await abortable.abort("ERR");
 * }
 * ```
 * There are a couple of limitations of this function:
 * - the given async iterable must implement throw
 * - the async iterable cannot be re-use
 * - if source catches errors and yields values for them, they are ignored, and
 *   the source may still dangle
 *
 * There are four possible ways an async function* can handle yield errors:
 * 1. don't catch errors at all - Abortable.abort() will resolve "rethrown"
 * 2. catch errors and rethrow - Abortable.abort() will resolve "rethrown"
 * 3. catch errors and return - Abortable.abort() will resolve "completed"
 * 4. catch errors and yield a value - Abortable.abort() will resolve "caught"
 *
 * Note that catching errors and yielding a value is problematic, and it should
 * be documented that this may leave the source in a dangling state.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function makeIterableAbortable(iterable) {
    const innerCandidate = iterable[Symbol.asyncIterator]();
    if (innerCandidate.throw === undefined) {
        throw new Error("AsyncIterable does not implement throw");
    }
    const inner = innerCandidate;
    let aborted;
    let resultPromise;
    let it = {
        next() {
            resultPromise = inner.next().finally(() => {
                resultPromise = undefined;
            });
            return resultPromise;
        },
        throw(e) {
            return inner.throw(e);
        },
    };
    if (innerCandidate.return !== undefined) {
        it = Object.assign(Object.assign({}, it), { return(value) {
                return inner.return(value);
            } });
    }
    let used = false;
    return {
        abort(reason) {
            if (aborted) {
                return aborted.state;
            }
            const f = () => {
                return inner.throw(reason).then((r) => (r.done === true ? "completed" : "caught"), () => "rethrown");
            };
            if (resultPromise) {
                aborted = { reason, state: resultPromise.then(f, f) };
                return aborted.state;
            }
            aborted = { reason, state: f() };
            return aborted.state;
        },
        [Symbol.asyncIterator]() {
            if (used) {
                throw new Error("AsyncIterable cannot be re-used");
            }
            used = true;
            return it;
        },
    };
}
/**
 * Create a new WritableIterable.
 */
function createWritableIterable() {
    // We start with two queues to capture the read and write attempts.
    //
    // The writes and reads each check of their counterpart is
    // already available and either interact/add themselves to the queue.
    const readQueue = [];
    const writeQueue = [];
    let err = undefined;
    let nextResolve;
    let nextReject;
    let nextPromise = new Promise((resolve, reject) => {
        nextResolve = resolve;
        nextReject = reject;
    });
    let closed = false;
    // drain the readQueue in case of error/writer is closed by sending a
    // done result.
    function drain() {
        for (const next of readQueue.splice(0, readQueue.length)) {
            next({ done: true, value: undefined });
        }
    }
    return {
        close() {
            closed = true;
            drain();
        },
        async write(payload) {
            if (closed) {
                throw err !== null && err !== void 0 ? err : new Error("cannot write, WritableIterable already closed");
            }
            const read = readQueue.shift();
            if (read === undefined) {
                // We didn't find a pending read so we add the payload to the write queue.
                writeQueue.push(payload);
            }
            else {
                // We found a pending read so we respond with the payload.
                read({ done: false, value: payload });
                if (readQueue.length > 0) {
                    // If there are more in the read queue we can mark the write as complete.
                    // as the error reporting is not guaranteed to be sequential and therefore cannot
                    // to linked to a specific write.
                    return;
                }
            }
            // We await the next call for as many times as there are items in the queue + 1
            //
            // If there are no items in the write queue that means write happened and we just have
            // to wait for one more call likewise if we are the nth write in the queue we
            // have to wait for n writes to complete and one more.
            const limit = writeQueue.length + 1;
            for (let i = 0; i < limit; i++) {
                await nextPromise;
            }
        },
        [Symbol.asyncIterator]() {
            return {
                next() {
                    // Resolve the nextPromise to indicate
                    // pending writes that a read attempt has been made
                    // after their write.
                    //
                    // We also need to reset the promise for future writes.
                    nextResolve();
                    nextPromise = new Promise((resolve, reject) => {
                        nextResolve = resolve;
                        nextReject = reject;
                    });
                    const write = writeQueue.shift();
                    if (write !== undefined) {
                        // We found a pending write so response with the payload.
                        return Promise.resolve({ done: false, value: write });
                    }
                    if (closed) {
                        return Promise.resolve({ done: true, value: undefined });
                    }
                    // We return a promise immediately that is either resolved/rejected
                    // as writes happen.
                    let readResolve;
                    const readPromise = new Promise((resolve) => (readResolve = resolve));
                    readQueue.push(readResolve); // eslint-disable-line @typescript-eslint/no-non-null-assertion
                    return readPromise;
                },
                throw(throwErr) {
                    err = throwErr;
                    closed = true;
                    writeQueue.splice(0, writeQueue.length);
                    nextPromise.catch(() => {
                        // To make sure that the nextPromise is always resolved.
                    });
                    // This will reject all pending writes.
                    nextReject(err);
                    drain();
                    return Promise.resolve({ done: true, value: undefined });
                },
                return() {
                    closed = true;
                    writeQueue.splice(0, writeQueue.length);
                    // Resolve once for the write awaiting confirmation.
                    nextResolve();
                    // Reject all future writes.
                    nextPromise = Promise.reject(new Error("cannot write, consumer called return"));
                    nextPromise.catch(() => {
                        // To make sure that the nextPromise is always resolved.
                    });
                    drain();
                    return Promise.resolve({ done: true, value: undefined });
                },
            };
        },
    };
}
/**
 * Create an asynchronous iterable from an array.
 *
 * @private Internal code, does not follow semantic versioning.
 */
// eslint-disable-next-line @typescript-eslint/require-await
function createAsyncIterable(items) {
    return __asyncGenerator(this, arguments, function* createAsyncIterable_1() {
        yield __await(yield* __asyncDelegator(__asyncValues(items)));
    });
}
