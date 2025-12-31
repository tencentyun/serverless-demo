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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTrailer = exports.validateResponseWithCompression = exports.validateResponse = exports.grpcStatusOk = exports.setTrailerStatus = exports.findTrailerError = exports.parseTimeout = exports.contentTypeProto = exports.contentTypeJson = exports.contentTypeRegExp = exports.parseContentType = exports.requestHeaderWithCompression = exports.requestHeader = exports.codeFromHttpStatus = exports.createTransport = exports.createHandlerFactory = void 0;
var handler_factory_js_1 = require("./handler-factory.js");
Object.defineProperty(exports, "createHandlerFactory", { enumerable: true, get: function () { return handler_factory_js_1.createHandlerFactory; } });
var transport_js_1 = require("./transport.js");
Object.defineProperty(exports, "createTransport", { enumerable: true, get: function () { return transport_js_1.createTransport; } });
// All exports below are private — internal code that does not follow semantic
// versioning.
// We will try hard to avoid breaking changes, but if you depend on the
// following exports, we recommend that you do so with an exact version
// constraint (no ~ or ^).
var http_status_js_1 = require("./http-status.js");
Object.defineProperty(exports, "codeFromHttpStatus", { enumerable: true, get: function () { return http_status_js_1.codeFromHttpStatus; } });
var request_header_js_1 = require("./request-header.js");
Object.defineProperty(exports, "requestHeader", { enumerable: true, get: function () { return request_header_js_1.requestHeader; } });
Object.defineProperty(exports, "requestHeaderWithCompression", { enumerable: true, get: function () { return request_header_js_1.requestHeaderWithCompression; } });
var content_type_js_1 = require("./content-type.js");
Object.defineProperty(exports, "parseContentType", { enumerable: true, get: function () { return content_type_js_1.parseContentType; } });
Object.defineProperty(exports, "contentTypeRegExp", { enumerable: true, get: function () { return content_type_js_1.contentTypeRegExp; } });
Object.defineProperty(exports, "contentTypeJson", { enumerable: true, get: function () { return content_type_js_1.contentTypeJson; } });
Object.defineProperty(exports, "contentTypeProto", { enumerable: true, get: function () { return content_type_js_1.contentTypeProto; } });
var parse_timeout_js_1 = require("./parse-timeout.js");
Object.defineProperty(exports, "parseTimeout", { enumerable: true, get: function () { return parse_timeout_js_1.parseTimeout; } });
var trailer_status_js_1 = require("./trailer-status.js");
Object.defineProperty(exports, "findTrailerError", { enumerable: true, get: function () { return trailer_status_js_1.findTrailerError; } });
Object.defineProperty(exports, "setTrailerStatus", { enumerable: true, get: function () { return trailer_status_js_1.setTrailerStatus; } });
Object.defineProperty(exports, "grpcStatusOk", { enumerable: true, get: function () { return trailer_status_js_1.grpcStatusOk; } });
var validate_response_js_1 = require("./validate-response.js");
Object.defineProperty(exports, "validateResponse", { enumerable: true, get: function () { return validate_response_js_1.validateResponse; } });
Object.defineProperty(exports, "validateResponseWithCompression", { enumerable: true, get: function () { return validate_response_js_1.validateResponseWithCompression; } });
var validate_trailer_js_1 = require("./validate-trailer.js");
Object.defineProperty(exports, "validateTrailer", { enumerable: true, get: function () { return validate_trailer_js_1.validateTrailer; } });
__exportStar(require("./headers.js"), exports);
