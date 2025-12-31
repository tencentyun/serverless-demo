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
exports.grpcStatusOk = exports.validateTrailer = exports.setTrailerStatus = exports.parseTimeout = exports.createTrailerSerialization = exports.trailerSerialize = exports.trailerParse = exports.trailerFlag = exports.validateResponseWithCompression = exports.validateResponse = exports.contentTypeJson = exports.contentTypeProto = exports.contentTypeRegExp = exports.parseContentType = exports.requestHeaderWithCompression = exports.requestHeader = exports.createTransport = exports.createHandlerFactory = void 0;
var handler_factory_js_1 = require("./handler-factory.js");
Object.defineProperty(exports, "createHandlerFactory", { enumerable: true, get: function () { return handler_factory_js_1.createHandlerFactory; } });
var transport_js_1 = require("./transport.js");
Object.defineProperty(exports, "createTransport", { enumerable: true, get: function () { return transport_js_1.createTransport; } });
// All exports below are private — internal code that does not follow semantic
// versioning.
// We will try hard to avoid breaking changes, but if you depend on the
// following exports, we recommend that you do so with an exact version
// constraint (no ~ or ^).
var request_header_js_1 = require("./request-header.js");
Object.defineProperty(exports, "requestHeader", { enumerable: true, get: function () { return request_header_js_1.requestHeader; } });
Object.defineProperty(exports, "requestHeaderWithCompression", { enumerable: true, get: function () { return request_header_js_1.requestHeaderWithCompression; } });
var content_type_js_1 = require("./content-type.js");
Object.defineProperty(exports, "parseContentType", { enumerable: true, get: function () { return content_type_js_1.parseContentType; } });
Object.defineProperty(exports, "contentTypeRegExp", { enumerable: true, get: function () { return content_type_js_1.contentTypeRegExp; } });
Object.defineProperty(exports, "contentTypeProto", { enumerable: true, get: function () { return content_type_js_1.contentTypeProto; } });
Object.defineProperty(exports, "contentTypeJson", { enumerable: true, get: function () { return content_type_js_1.contentTypeJson; } });
var validate_response_js_1 = require("./validate-response.js");
Object.defineProperty(exports, "validateResponse", { enumerable: true, get: function () { return validate_response_js_1.validateResponse; } });
Object.defineProperty(exports, "validateResponseWithCompression", { enumerable: true, get: function () { return validate_response_js_1.validateResponseWithCompression; } });
var trailer_js_1 = require("./trailer.js");
Object.defineProperty(exports, "trailerFlag", { enumerable: true, get: function () { return trailer_js_1.trailerFlag; } });
Object.defineProperty(exports, "trailerParse", { enumerable: true, get: function () { return trailer_js_1.trailerParse; } });
Object.defineProperty(exports, "trailerSerialize", { enumerable: true, get: function () { return trailer_js_1.trailerSerialize; } });
Object.defineProperty(exports, "createTrailerSerialization", { enumerable: true, get: function () { return trailer_js_1.createTrailerSerialization; } });
var index_js_1 = require("../protocol-grpc/index.js");
Object.defineProperty(exports, "parseTimeout", { enumerable: true, get: function () { return index_js_1.parseTimeout; } });
Object.defineProperty(exports, "setTrailerStatus", { enumerable: true, get: function () { return index_js_1.setTrailerStatus; } });
Object.defineProperty(exports, "validateTrailer", { enumerable: true, get: function () { return index_js_1.validateTrailer; } });
Object.defineProperty(exports, "grpcStatusOk", { enumerable: true, get: function () { return index_js_1.grpcStatusOk; } });
__exportStar(require("./headers.js"), exports);
