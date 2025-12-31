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
exports.requestHeader = requestHeader;
exports.requestHeaderWithCompression = requestHeaderWithCompression;
const headers_js_1 = require("./headers.js");
const version_js_1 = require("./version.js");
const content_type_js_1 = require("./content-type.js");
/**
 * Creates headers for a Connect request.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function requestHeader(methodKind, useBinaryFormat, timeoutMs, userProvidedHeaders, setUserAgent) {
    const result = new Headers(userProvidedHeaders !== null && userProvidedHeaders !== void 0 ? userProvidedHeaders : {});
    if (timeoutMs !== undefined) {
        result.set(headers_js_1.headerTimeout, `${timeoutMs}`);
    }
    result.set(headers_js_1.headerContentType, methodKind == "unary"
        ? useBinaryFormat
            ? content_type_js_1.contentTypeUnaryProto
            : content_type_js_1.contentTypeUnaryJson
        : useBinaryFormat
            ? content_type_js_1.contentTypeStreamProto
            : content_type_js_1.contentTypeStreamJson);
    result.set(headers_js_1.headerProtocolVersion, version_js_1.protocolVersion);
    if (!result.has(headers_js_1.headerUserAgent) && setUserAgent) {
        // Note that we do not strictly comply with gRPC user agents.
        // We use "connect-es/1.2.3" where gRPC would use "grpc-es/1.2.3".
        // See https://github.com/grpc/grpc/blob/c462bb8d485fc1434ecfae438823ca8d14cf3154/doc/PROTOCOL-HTTP2.md#user-agents
        result.set(headers_js_1.headerUserAgent, "connect-es/2.0.0-rc.3");
    }
    return result;
}
/**
 * Creates headers for a Connect request with compression.
 *
 * Note that we always set the Content-Encoding header for unary methods.
 * It is up to the caller to decide whether to apply compression - and remove
 * the header if compression is not used, for example because the payload is
 * too small to make compression effective.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function requestHeaderWithCompression(methodKind, useBinaryFormat, timeoutMs, userProvidedHeaders, acceptCompression, sendCompression, setUserAgent) {
    const result = requestHeader(methodKind, useBinaryFormat, timeoutMs, userProvidedHeaders, setUserAgent);
    if (sendCompression != null) {
        const name = methodKind == "unary" ? headers_js_1.headerUnaryEncoding : headers_js_1.headerStreamEncoding;
        result.set(name, sendCompression.name);
    }
    if (acceptCompression.length > 0) {
        const name = methodKind == "unary"
            ? headers_js_1.headerUnaryAcceptEncoding
            : headers_js_1.headerStreamAcceptEncoding;
        result.set(name, acceptCompression.map((c) => c.name).join(","));
    }
    return result;
}
