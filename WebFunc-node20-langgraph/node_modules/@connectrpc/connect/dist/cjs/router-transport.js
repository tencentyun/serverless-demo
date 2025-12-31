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
exports.createRouterTransport = createRouterTransport;
const transport_js_1 = require("./protocol-connect/transport.js");
const universal_handler_client_js_1 = require("./protocol/universal-handler-client.js");
const router_js_1 = require("./router.js");
/**
 * Creates a Transport that routes requests to the configured router. Useful for testing
 * and calling services running in the same process.
 *
 * This can be used to test both client logic by using this to stub/mock the backend,
 * and to test server logic by using this to run without needing to spin up a server.
 */
function createRouterTransport(routes, options) {
    var _a, _b;
    const router = (0, router_js_1.createConnectRouter)(Object.assign(Object.assign({}, ((_a = options === null || options === void 0 ? void 0 : options.router) !== null && _a !== void 0 ? _a : {})), { connect: true }));
    routes(router);
    return (0, transport_js_1.createTransport)(Object.assign({ httpClient: (0, universal_handler_client_js_1.createUniversalHandlerClient)(router.handlers), baseUrl: "https://in-memory", useBinaryFormat: true, interceptors: [], acceptCompression: [], sendCompression: null, compressMinBytes: Number.MAX_SAFE_INTEGER, readMaxBytes: Number.MAX_SAFE_INTEGER, writeMaxBytes: Number.MAX_SAFE_INTEGER }, ((_b = options === null || options === void 0 ? void 0 : options.transport) !== null && _b !== void 0 ? _b : {})));
}
