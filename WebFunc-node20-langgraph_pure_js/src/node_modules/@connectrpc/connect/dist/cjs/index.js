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
exports.createRouterTransport = exports.createMethodImplSpec = exports.createServiceImplSpec = exports.makeAnyClient = exports.createContextValues = exports.createContextKey = exports.cors = exports.createHandlerContext = exports.createConnectRouter = exports.createClient = exports.createCallbackClient = exports.appendHeaders = exports.decodeBinaryHeader = exports.encodeBinaryHeader = exports.Code = exports.ConnectError = void 0;
var connect_error_js_1 = require("./connect-error.js");
Object.defineProperty(exports, "ConnectError", { enumerable: true, get: function () { return connect_error_js_1.ConnectError; } });
var code_js_1 = require("./code.js");
Object.defineProperty(exports, "Code", { enumerable: true, get: function () { return code_js_1.Code; } });
var http_headers_js_1 = require("./http-headers.js");
Object.defineProperty(exports, "encodeBinaryHeader", { enumerable: true, get: function () { return http_headers_js_1.encodeBinaryHeader; } });
Object.defineProperty(exports, "decodeBinaryHeader", { enumerable: true, get: function () { return http_headers_js_1.decodeBinaryHeader; } });
Object.defineProperty(exports, "appendHeaders", { enumerable: true, get: function () { return http_headers_js_1.appendHeaders; } });
var callback_client_js_1 = require("./callback-client.js");
Object.defineProperty(exports, "createCallbackClient", { enumerable: true, get: function () { return callback_client_js_1.createCallbackClient; } });
var promise_client_js_1 = require("./promise-client.js");
Object.defineProperty(exports, "createClient", { enumerable: true, get: function () { return promise_client_js_1.createClient; } });
var router_js_1 = require("./router.js");
Object.defineProperty(exports, "createConnectRouter", { enumerable: true, get: function () { return router_js_1.createConnectRouter; } });
var implementation_js_1 = require("./implementation.js");
Object.defineProperty(exports, "createHandlerContext", { enumerable: true, get: function () { return implementation_js_1.createHandlerContext; } });
var cors_js_1 = require("./cors.js");
Object.defineProperty(exports, "cors", { enumerable: true, get: function () { return cors_js_1.cors; } });
var context_values_js_1 = require("./context-values.js");
Object.defineProperty(exports, "createContextKey", { enumerable: true, get: function () { return context_values_js_1.createContextKey; } });
Object.defineProperty(exports, "createContextValues", { enumerable: true, get: function () { return context_values_js_1.createContextValues; } });
// Symbols above should be relevant to end users.
// Symbols below should only be relevant for other libraries.
var any_client_js_1 = require("./any-client.js");
Object.defineProperty(exports, "makeAnyClient", { enumerable: true, get: function () { return any_client_js_1.makeAnyClient; } });
var implementation_js_2 = require("./implementation.js");
Object.defineProperty(exports, "createServiceImplSpec", { enumerable: true, get: function () { return implementation_js_2.createServiceImplSpec; } });
Object.defineProperty(exports, "createMethodImplSpec", { enumerable: true, get: function () { return implementation_js_2.createMethodImplSpec; } });
var router_transport_js_1 = require("./router-transport.js");
Object.defineProperty(exports, "createRouterTransport", { enumerable: true, get: function () { return router_transport_js_1.createRouterTransport; } });
