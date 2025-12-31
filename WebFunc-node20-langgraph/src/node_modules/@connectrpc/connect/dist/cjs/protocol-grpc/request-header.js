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
const content_type_js_1 = require("./content-type.js");
/**
 * Creates headers for a gRPC request.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function requestHeader(useBinaryFormat, timeoutMs, userProvidedHeaders) {
    const result = new Headers(userProvidedHeaders !== null && userProvidedHeaders !== void 0 ? userProvidedHeaders : {});
    result.set(headers_js_1.headerContentType, useBinaryFormat ? content_type_js_1.contentTypeProto : content_type_js_1.contentTypeJson);
    if (!result.has(headers_js_1.headerUserAgent)) {
        // Note that we do not strictly comply with gRPC user agents.
        // We use "connect-es/1.2.3" where gRPC would use "grpc-es/1.2.3".
        // See https://github.com/grpc/grpc/blob/c462bb8d485fc1434ecfae438823ca8d14cf3154/doc/PROTOCOL-HTTP2.md#user-agents
        result.set(headers_js_1.headerUserAgent, "connect-es/2.0.0-rc.3");
    }
    if (timeoutMs !== undefined) {
        result.set(headers_js_1.headerTimeout, `${timeoutMs}m`);
    }
    // The gRPC-HTTP2 specification requires this - it flushes out proxies that
    // don't support HTTP trailers.
    result.set("Te", "trailers");
    return result;
}
/**
 * Creates headers for a gRPC request with compression.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function requestHeaderWithCompression(useBinaryFormat, timeoutMs, userProvidedHeaders, acceptCompression, sendCompression) {
    const result = requestHeader(useBinaryFormat, timeoutMs, userProvidedHeaders);
    if (sendCompression != null) {
        result.set(headers_js_1.headerEncoding, sendCompression.name);
    }
    if (acceptCompression.length > 0) {
        result.set(headers_js_1.headerAcceptEncoding, acceptCompression.map((c) => c.name).join(","));
    }
    return result;
}
