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
exports.codeToString = exports.codeFromString = exports.protocolVersion = exports.transformConnectPostToGetRequest = exports.trailerDemux = exports.trailerMux = exports.validateResponseWithCompression = exports.validateResponse = exports.parseTimeout = exports.contentTypeStreamRegExp = exports.contentTypeUnaryRegExp = exports.contentTypeRegExp = exports.contentTypeStreamJson = exports.contentTypeStreamProto = exports.contentTypeUnaryJson = exports.contentTypeUnaryProto = exports.parseContentType = exports.errorToJsonBytes = exports.errorToJson = exports.errorFromJsonBytes = exports.errorFromJson = exports.createEndStreamSerialization = exports.endStreamFlag = exports.endStreamFromJson = exports.endStreamToJson = exports.requestHeaderWithCompression = exports.requestHeader = exports.codeToHttpStatus = exports.codeFromHttpStatus = exports.createTransport = exports.createHandlerFactory = void 0;
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
Object.defineProperty(exports, "codeToHttpStatus", { enumerable: true, get: function () { return http_status_js_1.codeToHttpStatus; } });
var request_header_js_1 = require("./request-header.js");
Object.defineProperty(exports, "requestHeader", { enumerable: true, get: function () { return request_header_js_1.requestHeader; } });
Object.defineProperty(exports, "requestHeaderWithCompression", { enumerable: true, get: function () { return request_header_js_1.requestHeaderWithCompression; } });
var end_stream_js_1 = require("./end-stream.js");
Object.defineProperty(exports, "endStreamToJson", { enumerable: true, get: function () { return end_stream_js_1.endStreamToJson; } });
Object.defineProperty(exports, "endStreamFromJson", { enumerable: true, get: function () { return end_stream_js_1.endStreamFromJson; } });
Object.defineProperty(exports, "endStreamFlag", { enumerable: true, get: function () { return end_stream_js_1.endStreamFlag; } });
Object.defineProperty(exports, "createEndStreamSerialization", { enumerable: true, get: function () { return end_stream_js_1.createEndStreamSerialization; } });
var error_json_js_1 = require("./error-json.js");
Object.defineProperty(exports, "errorFromJson", { enumerable: true, get: function () { return error_json_js_1.errorFromJson; } });
Object.defineProperty(exports, "errorFromJsonBytes", { enumerable: true, get: function () { return error_json_js_1.errorFromJsonBytes; } });
Object.defineProperty(exports, "errorToJson", { enumerable: true, get: function () { return error_json_js_1.errorToJson; } });
Object.defineProperty(exports, "errorToJsonBytes", { enumerable: true, get: function () { return error_json_js_1.errorToJsonBytes; } });
var content_type_js_1 = require("./content-type.js");
Object.defineProperty(exports, "parseContentType", { enumerable: true, get: function () { return content_type_js_1.parseContentType; } });
Object.defineProperty(exports, "contentTypeUnaryProto", { enumerable: true, get: function () { return content_type_js_1.contentTypeUnaryProto; } });
Object.defineProperty(exports, "contentTypeUnaryJson", { enumerable: true, get: function () { return content_type_js_1.contentTypeUnaryJson; } });
Object.defineProperty(exports, "contentTypeStreamProto", { enumerable: true, get: function () { return content_type_js_1.contentTypeStreamProto; } });
Object.defineProperty(exports, "contentTypeStreamJson", { enumerable: true, get: function () { return content_type_js_1.contentTypeStreamJson; } });
Object.defineProperty(exports, "contentTypeRegExp", { enumerable: true, get: function () { return content_type_js_1.contentTypeRegExp; } });
Object.defineProperty(exports, "contentTypeUnaryRegExp", { enumerable: true, get: function () { return content_type_js_1.contentTypeUnaryRegExp; } });
Object.defineProperty(exports, "contentTypeStreamRegExp", { enumerable: true, get: function () { return content_type_js_1.contentTypeStreamRegExp; } });
var parse_timeout_js_1 = require("./parse-timeout.js");
Object.defineProperty(exports, "parseTimeout", { enumerable: true, get: function () { return parse_timeout_js_1.parseTimeout; } });
var validate_response_js_1 = require("./validate-response.js");
Object.defineProperty(exports, "validateResponse", { enumerable: true, get: function () { return validate_response_js_1.validateResponse; } });
Object.defineProperty(exports, "validateResponseWithCompression", { enumerable: true, get: function () { return validate_response_js_1.validateResponseWithCompression; } });
var trailer_mux_js_1 = require("./trailer-mux.js");
Object.defineProperty(exports, "trailerMux", { enumerable: true, get: function () { return trailer_mux_js_1.trailerMux; } });
Object.defineProperty(exports, "trailerDemux", { enumerable: true, get: function () { return trailer_mux_js_1.trailerDemux; } });
__exportStar(require("./headers.js"), exports);
var get_request_js_1 = require("./get-request.js");
Object.defineProperty(exports, "transformConnectPostToGetRequest", { enumerable: true, get: function () { return get_request_js_1.transformConnectPostToGetRequest; } });
var version_js_1 = require("./version.js");
Object.defineProperty(exports, "protocolVersion", { enumerable: true, get: function () { return version_js_1.protocolVersion; } });
var code_string_js_1 = require("./code-string.js");
Object.defineProperty(exports, "codeFromString", { enumerable: true, get: function () { return code_string_js_1.codeFromString; } });
var code_string_js_2 = require("./code-string.js");
Object.defineProperty(exports, "codeToString", { enumerable: true, get: function () { return code_string_js_2.codeToString; } });
