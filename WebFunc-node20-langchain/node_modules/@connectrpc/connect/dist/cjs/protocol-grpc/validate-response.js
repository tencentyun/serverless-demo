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
const http_status_js_1 = require("./http-status.js");
const connect_error_js_1 = require("../connect-error.js");
const trailer_status_js_1 = require("./trailer-status.js");
const code_js_1 = require("../code.js");
const headers_js_1 = require("./headers.js");
const content_type_js_1 = require("./content-type.js");
/**
 * Validates response status and header for the gRPC protocol.
 * Throws a ConnectError if the header contains an error status,
 * or if the HTTP status indicates an error.
 *
 * Returns an object that indicates whether a gRPC status was found
 * in the response header. In this case, clients can not expect a
 * trailer.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function validateResponse(status, headers) {
    if (status != 200) {
        throw new connect_error_js_1.ConnectError(`HTTP ${status}`, (0, http_status_js_1.codeFromHttpStatus)(status), headers);
    }
    const mimeType = headers.get(headers_js_1.headerContentType);
    const parsedType = (0, content_type_js_1.parseContentType)(mimeType);
    if (parsedType == undefined) {
        throw new connect_error_js_1.ConnectError(`unsupported content type ${mimeType}`, code_js_1.Code.Unknown);
    }
    return {
        foundStatus: headers.has(headers_js_1.headerGrpcStatus),
        headerError: (0, trailer_status_js_1.findTrailerError)(headers),
    };
}
/**
 * Validates response status and header for the gRPC protocol.
 * This function is identical to validateResponse(), but also verifies
 * that a given encoding header is acceptable.
 *
 * Returns an object with the response compression, and a boolean
 * indicating whether a gRPC status was found in the response header
 * (in this case, clients can not expect a trailer).
 *
 * @private Internal code, does not follow semantic versioning.
 */
function validateResponseWithCompression(acceptCompression, status, headers) {
    const { foundStatus, headerError } = validateResponse(status, headers);
    let compression;
    const encoding = headers.get(headers_js_1.headerEncoding);
    if (encoding !== null && encoding.toLowerCase() !== "identity") {
        compression = acceptCompression.find((c) => c.name === encoding);
        if (!compression) {
            throw new connect_error_js_1.ConnectError(`unsupported response encoding "${encoding}"`, code_js_1.Code.Internal, headers);
        }
    }
    return {
        foundStatus,
        compression,
        headerError,
    };
}
