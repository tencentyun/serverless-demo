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
import { ConnectError } from "./connect-error.js";
import { Code } from "./code.js";
import { createDeadlineSignal, createLinkedAbortController, } from "./protocol/signals.js";
import { createContextValues } from "./context-values.js";
/**
 * Create a new HandlerContext.
 *
 * The context is usually automatically created by handlers, but if a service
 * implementation is used in unit tests, this function can be used to create
 * a context.
 */
export function createHandlerContext(init) {
    var _a;
    let timeoutMs;
    if (init.timeoutMs !== undefined) {
        const date = new Date(Date.now() + init.timeoutMs);
        timeoutMs = () => date.getTime() - Date.now();
    }
    else {
        timeoutMs = () => undefined;
    }
    const deadline = createDeadlineSignal(init.timeoutMs);
    const abortController = createLinkedAbortController(deadline.signal, init.requestSignal, init.shutdownSignal);
    return Object.assign(Object.assign({}, init), { signal: abortController.signal, timeoutMs, requestHeader: new Headers(init.requestHeader), responseHeader: new Headers(init.responseHeader), responseTrailer: new Headers(init.responseTrailer), abort(reason) {
            deadline.cleanup();
            abortController.abort(reason);
        }, values: (_a = init.contextValues) !== null && _a !== void 0 ? _a : createContextValues() });
}
/**
 * Create an MethodImplSpec - a user-provided implementation for a method,
 * wrapped in a discriminated union type along with service and method metadata.
 */
export function createMethodImplSpec(method, impl) {
    return {
        kind: method.methodKind,
        method,
        impl,
    };
}
/**
 * Create an ServiceImplSpec - a user-provided service implementation wrapped
 * with metadata.
 */
export function createServiceImplSpec(service, impl) {
    const s = { service, methods: {} };
    for (const method of service.methods) {
        let fn = impl[method.localName];
        if (typeof fn == "function") {
            fn = fn.bind(impl);
        }
        else {
            const message = `${service.typeName}.${method.name} is not implemented`;
            fn = function unimplemented() {
                throw new ConnectError(message, Code.Unimplemented);
            };
        }
        s.methods[method.localName] = createMethodImplSpec(method, fn);
    }
    return s;
}
