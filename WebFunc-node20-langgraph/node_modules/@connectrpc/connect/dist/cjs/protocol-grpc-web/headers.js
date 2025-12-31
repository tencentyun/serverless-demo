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
exports.headerXGrpcWeb = exports.headerXUserAgent = exports.headerUserAgent = exports.headerStatusDetailsBin = exports.headerGrpcMessage = exports.headerGrpcStatus = exports.headerTimeout = exports.headerAcceptEncoding = exports.headerEncoding = exports.headerContentType = void 0;
/**
 * @private Internal code, does not follow semantic versioning.
 */
var headers_js_1 = require("../protocol-grpc/headers.js");
Object.defineProperty(exports, "headerContentType", { enumerable: true, get: function () { return headers_js_1.headerContentType; } });
Object.defineProperty(exports, "headerEncoding", { enumerable: true, get: function () { return headers_js_1.headerEncoding; } });
Object.defineProperty(exports, "headerAcceptEncoding", { enumerable: true, get: function () { return headers_js_1.headerAcceptEncoding; } });
Object.defineProperty(exports, "headerTimeout", { enumerable: true, get: function () { return headers_js_1.headerTimeout; } });
Object.defineProperty(exports, "headerGrpcStatus", { enumerable: true, get: function () { return headers_js_1.headerGrpcStatus; } });
Object.defineProperty(exports, "headerGrpcMessage", { enumerable: true, get: function () { return headers_js_1.headerGrpcMessage; } });
Object.defineProperty(exports, "headerStatusDetailsBin", { enumerable: true, get: function () { return headers_js_1.headerStatusDetailsBin; } });
Object.defineProperty(exports, "headerUserAgent", { enumerable: true, get: function () { return headers_js_1.headerUserAgent; } });
/**
 * gRPC-web does not use the standard header User-Agent.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.headerXUserAgent = "X-User-Agent";
/**
 * The canonical grpc/grpc-web JavaScript implementation sets
 * this request header with value "1".
 * Some servers may rely on the header to identify gRPC-web
 * requests. For example the proxy by improbable:
 * https://github.com/improbable-eng/grpc-web/blob/53aaf4cdc0fede7103c1b06f0cfc560c003a5c41/go/grpcweb/wrapper.go#L231
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.headerXGrpcWeb = "X-Grpc-Web";
