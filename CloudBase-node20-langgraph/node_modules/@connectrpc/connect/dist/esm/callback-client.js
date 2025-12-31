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
import { create } from "@bufbuild/protobuf";
import { ConnectError } from "./connect-error.js";
import { Code } from "./code.js";
import { makeAnyClient } from "./any-client.js";
import { createAsyncIterable } from "./protocol/async-iterable.js";
/**
 * Create a CallbackClient for the given service, invoking RPCs through the
 * given transport.
 */
export function createCallbackClient(service, transport) {
    return makeAnyClient(service, (method) => {
        switch (method.methodKind) {
            case "unary":
                return createUnaryFn(transport, method);
            case "server_streaming":
                return createServerStreamingFn(transport, method);
            default:
                return null;
        }
    });
}
function createUnaryFn(transport, method) {
    return function (requestMessage, callback, options) {
        const abort = new AbortController();
        options = wrapSignal(abort, options);
        transport
            .unary(method, abort.signal, options.timeoutMs, options.headers, requestMessage, options.contextValues)
            .then((response) => {
            var _a, _b;
            (_a = options.onHeader) === null || _a === void 0 ? void 0 : _a.call(options, response.header);
            (_b = options.onTrailer) === null || _b === void 0 ? void 0 : _b.call(options, response.trailer);
            callback(undefined, response.message);
        }, (reason) => {
            const err = ConnectError.from(reason, Code.Internal);
            if (err.code === Code.Canceled && abort.signal.aborted) {
                // As documented, discard Canceled errors if canceled by the user.
                return;
            }
            callback(err, create(method.output));
        });
        return () => abort.abort();
    };
}
function createServerStreamingFn(transport, method) {
    return function (input, onResponse, onClose, options) {
        const abort = new AbortController();
        async function run() {
            var _a, e_1, _b, _c;
            var _d, _e;
            options = wrapSignal(abort, options);
            const response = await transport.stream(method, options.signal, options.timeoutMs, options.headers, createAsyncIterable([input]), options.contextValues);
            (_d = options.onHeader) === null || _d === void 0 ? void 0 : _d.call(options, response.header);
            try {
                for (var _f = true, _g = __asyncValues(response.message), _h; _h = await _g.next(), _a = _h.done, !_a; _f = true) {
                    _c = _h.value;
                    _f = false;
                    const message = _c;
                    onResponse(message);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_f && !_a && (_b = _g.return)) await _b.call(_g);
                }
                finally { if (e_1) throw e_1.error; }
            }
            (_e = options.onTrailer) === null || _e === void 0 ? void 0 : _e.call(options, response.trailer);
            onClose(undefined);
        }
        run().catch((reason) => {
            const err = ConnectError.from(reason, Code.Internal);
            if (err.code === Code.Canceled && abort.signal.aborted) {
                // As documented, discard Canceled errors if canceled by the user,
                // but do invoke the close-callback.
                onClose(undefined);
            }
            else {
                onClose(err);
            }
        });
        return () => abort.abort();
    };
}
function wrapSignal(abort, options) {
    if (options === null || options === void 0 ? void 0 : options.signal) {
        options.signal.addEventListener("abort", () => abort.abort());
        if (options.signal.aborted) {
            abort.abort();
        }
    }
    return Object.assign(Object.assign({}, options), { signal: abort.signal });
}
