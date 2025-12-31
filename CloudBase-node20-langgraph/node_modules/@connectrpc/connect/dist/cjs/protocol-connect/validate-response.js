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
exports.validateResponse = validateResponse;
exports.validateResponseWithCompression = validateResponseWithCompression;
const code_js_1 = require("../code.js");
const http_status_js_1 = require("./http-status.js");
const connect_error_js_1 = require("../connect-error.js");
const content_type_js_1 = require("./content-type.js");
const headers_js_1 = require("./headers.js");
/**
 * Validates response status and header for the Connect protocol.
 * Throws a ConnectError if the header indicates an error, or if
 * the content type is unexpected, with the following exception:
 * For unary RPCs with an HTTP error status, this returns an error
 * derived from the HTTP status instead of throwing it, giving an
 * implementation a chance to parse a Connect error from the wire.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function validateResponse(methodKind, useBinaryFormat, status, headers) {
    const mimeType = headers.get(headers_js_1.headerContentType);
    const parsedType = (0, content_type_js_1.parseContentType)(mimeType);
    if (status !== 200) {
        const errorFromStatus = new connect_error_js_1.ConnectError(`HTTP ${status}`, (0, http_status_js_1.codeFromHttpStatus)(status), headers);
        // If parsedType is defined and it is not binary, then this is a unary JSON response
        if (methodKind == "unary" && parsedType && !parsedType.binary) {
            return { isUnaryError: true, unaryError: errorFromStatus };
        }
        throw errorFromStatus;
    }
    const allowedContentType = {
        binary: useBinaryFormat,
        stream: methodKind !== "unary",
    };
    if ((parsedType === null || parsedType === void 0 ? void 0 : parsedType.binary) !== allowedContentType.binary ||
        parsedType.stream !== allowedContentType.stream) {
        throw new connect_error_js_1.ConnectError(`unsupported content type ${mimeType}`, parsedType === undefined ? code_js_1.Code.Unknown : code_js_1.Code.Internal, headers);
    }
    return { isUnaryError: false };
}
/**
 * Validates response status and header for the Connect protocol.
 * This function is identical to validateResponse(), but also verifies
 * that a given encoding header is acceptable.
 *
 * @private
 */
function validateResponseWithCompression(methodKind, acceptCompression, useBinaryFormat, status, headers) {
    let compression;
    const encoding = headers.get(methodKind == "unary" ? headers_js_1.headerUnaryEncoding : headers_js_1.headerStreamEncoding);
    if (encoding != null && encoding.toLowerCase() !== "identity") {
        compression = acceptCompression.find((c) => c.name === encoding);
        if (!compression) {
            throw new connect_error_js_1.ConnectError(`unsupported response encoding "${encoding}"`, code_js_1.Code.Internal, headers);
        }
    }
    return Object.assign({ compression }, validateResponse(methodKind, useBinaryFormat, status, headers));
}
