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
import { createMethodImplSpec, createServiceImplSpec, } from "./implementation.js";
import { createHandlerFactory as handlerFactoryGrpcWeb } from "./protocol-grpc-web/handler-factory.js";
import { createHandlerFactory as handlerFactoryGrpc } from "./protocol-grpc/handler-factory.js";
import { createHandlerFactory as handlerFactoryConnect } from "./protocol-connect/handler-factory.js";
import { createUniversalMethodHandler, createUniversalServiceHandlers, validateUniversalHandlerOptions, } from "./protocol/universal-handler.js";
/**
 * Create a new ConnectRouter.
 */
export function createConnectRouter(routerOptions) {
    const base = whichProtocols(routerOptions);
    const handlers = [];
    const router = {
        handlers,
        service: (service, implementation, options) => {
            const { protocols } = whichProtocols(options, base);
            handlers.push(...createUniversalServiceHandlers(createServiceImplSpec(service, implementation), protocols));
            return router;
        },
        rpc: (method, impl, opt) => {
            const { protocols } = whichProtocols(opt, base);
            handlers.push(createUniversalMethodHandler(createMethodImplSpec(method, impl), protocols));
            return router;
        },
    };
    return router;
}
function whichProtocols(options, base) {
    if (base && !options) {
        return base;
    }
    const opt = base
        ? Object.assign(Object.assign({}, validateUniversalHandlerOptions(base.options)), options) : Object.assign(Object.assign({}, options), validateUniversalHandlerOptions(options !== null && options !== void 0 ? options : {}));
    const protocols = [];
    if ((options === null || options === void 0 ? void 0 : options.grpc) !== false) {
        protocols.push(handlerFactoryGrpc(opt));
    }
    if ((options === null || options === void 0 ? void 0 : options.grpcWeb) !== false) {
        protocols.push(handlerFactoryGrpcWeb(opt));
    }
    if ((options === null || options === void 0 ? void 0 : options.connect) !== false) {
        protocols.push(handlerFactoryConnect(opt));
    }
    if (protocols.length === 0) {
        throw new ConnectError("cannot create handler, all protocols are disabled", Code.InvalidArgument);
    }
    return {
        options: opt,
        protocols,
    };
}
