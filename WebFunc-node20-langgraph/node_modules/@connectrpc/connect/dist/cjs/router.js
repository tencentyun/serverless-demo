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
exports.createConnectRouter = createConnectRouter;
const connect_error_js_1 = require("./connect-error.js");
const code_js_1 = require("./code.js");
const implementation_js_1 = require("./implementation.js");
const handler_factory_js_1 = require("./protocol-grpc-web/handler-factory.js");
const handler_factory_js_2 = require("./protocol-grpc/handler-factory.js");
const handler_factory_js_3 = require("./protocol-connect/handler-factory.js");
const universal_handler_js_1 = require("./protocol/universal-handler.js");
/**
 * Create a new ConnectRouter.
 */
function createConnectRouter(routerOptions) {
    const base = whichProtocols(routerOptions);
    const handlers = [];
    const router = {
        handlers,
        service: (service, implementation, options) => {
            const { protocols } = whichProtocols(options, base);
            handlers.push(...(0, universal_handler_js_1.createUniversalServiceHandlers)((0, implementation_js_1.createServiceImplSpec)(service, implementation), protocols));
            return router;
        },
        rpc: (method, impl, opt) => {
            const { protocols } = whichProtocols(opt, base);
            handlers.push((0, universal_handler_js_1.createUniversalMethodHandler)((0, implementation_js_1.createMethodImplSpec)(method, impl), protocols));
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
        ? Object.assign(Object.assign({}, (0, universal_handler_js_1.validateUniversalHandlerOptions)(base.options)), options) : Object.assign(Object.assign({}, options), (0, universal_handler_js_1.validateUniversalHandlerOptions)(options !== null && options !== void 0 ? options : {}));
    const protocols = [];
    if ((options === null || options === void 0 ? void 0 : options.grpc) !== false) {
        protocols.push((0, handler_factory_js_2.createHandlerFactory)(opt));
    }
    if ((options === null || options === void 0 ? void 0 : options.grpcWeb) !== false) {
        protocols.push((0, handler_factory_js_1.createHandlerFactory)(opt));
    }
    if ((options === null || options === void 0 ? void 0 : options.connect) !== false) {
        protocols.push((0, handler_factory_js_3.createHandlerFactory)(opt));
    }
    if (protocols.length === 0) {
        throw new connect_error_js_1.ConnectError("cannot create handler, all protocols are disabled", code_js_1.Code.InvalidArgument);
    }
    return {
        options: opt,
        protocols,
    };
}
