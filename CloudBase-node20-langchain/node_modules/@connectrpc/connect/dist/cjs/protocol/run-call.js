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
exports.runUnaryCall = runUnaryCall;
exports.runStreamingCall = runStreamingCall;
const interceptor_js_1 = require("../interceptor.js");
const connect_error_js_1 = require("../connect-error.js");
const signals_js_1 = require("./signals.js");
const normalize_js_1 = require("./normalize.js");
/**
 * Runs a unary method with the given interceptors. Note that this function
 * is only used when implementing a Transport.
 */
function runUnaryCall(opt) {
    const next = (0, interceptor_js_1.applyInterceptors)(opt.next, opt.interceptors);
    const [signal, abort, done] = setupSignal(opt);
    const req = Object.assign(Object.assign({}, opt.req), { message: (0, normalize_js_1.normalize)(opt.req.method.input, opt.req.message), signal });
    return next(req).then((res) => {
        done();
        return res;
    }, abort);
}
/**
 * Runs a server-streaming method with the given interceptors. Note that this
 * function is only used when implementing a Transport.
 */
function runStreamingCall(opt) {
    const next = (0, interceptor_js_1.applyInterceptors)(opt.next, opt.interceptors);
    const [signal, abort, done] = setupSignal(opt);
    const req = Object.assign(Object.assign({}, opt.req), { message: (0, normalize_js_1.normalizeIterable)(opt.req.method.input, opt.req.message), signal });
    let doneCalled = false;
    // Call return on the request iterable to indicate
    // that we will no longer consume it and it should
    // cleanup any allocated resources.
    signal.addEventListener("abort", function () {
        var _a, _b;
        const it = opt.req.message[Symbol.asyncIterator]();
        // If the signal is aborted due to an error, we want to throw
        // the error to the request iterator.
        if (!doneCalled) {
            (_a = it.throw) === null || _a === void 0 ? void 0 : _a.call(it, this.reason).catch(() => {
                // throw returns a promise, which we don't care about.
                //
                // Uncaught promises are thrown at sometime/somewhere by the event loop,
                // this is to ensure error is caught and ignored.
            });
        }
        (_b = it.return) === null || _b === void 0 ? void 0 : _b.call(it).catch(() => {
            // return returns a promise, which we don't care about.
            //
            // Uncaught promises are thrown at sometime/somewhere by the event loop,
            // this is to ensure error is caught and ignored.
        });
    });
    return next(req).then((res) => {
        return Object.assign(Object.assign({}, res), { message: {
                [Symbol.asyncIterator]() {
                    const it = res.message[Symbol.asyncIterator]();
                    return {
                        next() {
                            return it.next().then((r) => {
                                if (r.done == true) {
                                    doneCalled = true;
                                    done();
                                }
                                return r;
                            }, abort);
                        },
                        // We deliberately omit throw/return.
                    };
                },
            } });
    }, abort);
}
/**
 * Create an AbortSignal for Transport implementations. The signal is available
 * in UnaryRequest and StreamingRequest, and is triggered when the call is
 * aborted (via a timeout or explicit cancellation), errored (e.g. when reading
 * an error from the server from the wire), or finished successfully.
 *
 * Transport implementations can pass the signal to HTTP clients to ensure that
 * there are no unused connections leak.
 *
 * Returns a tuple:
 * [0]: The signal, which is also aborted if the optional deadline is reached.
 * [1]: Function to call if the Transport encountered an error.
 * [2]: Function to call if the Transport finished without an error.
 */
function setupSignal(opt) {
    const { signal, cleanup } = (0, signals_js_1.createDeadlineSignal)(opt.timeoutMs);
    const controller = (0, signals_js_1.createLinkedAbortController)(opt.signal, signal);
    return [
        controller.signal,
        function abort(reason) {
            // We peek at the deadline signal because fetch() will throw an error on
            // abort that discards the signal reason.
            const e = connect_error_js_1.ConnectError.from(signal.aborted ? (0, signals_js_1.getAbortSignalReason)(signal) : reason);
            controller.abort(e);
            cleanup();
            return Promise.reject(e);
        },
        function done() {
            cleanup();
            controller.abort();
        },
    ];
}
