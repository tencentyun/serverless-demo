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
exports.codeFromHttpStatus = codeFromHttpStatus;
const code_js_1 = require("../code.js");
/**
 * Determine the gRPC-web error code for the given HTTP status code.
 * See https://github.com/grpc/grpc/blob/master/doc/http-grpc-status-mapping.md.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function codeFromHttpStatus(httpStatus) {
    switch (httpStatus) {
        case 400: // Bad Request
            return code_js_1.Code.Internal;
        case 401: // Unauthorized
            return code_js_1.Code.Unauthenticated;
        case 403: // Forbidden
            return code_js_1.Code.PermissionDenied;
        case 404: // Not Found
            return code_js_1.Code.Unimplemented;
        case 429: // Too Many Requests
            return code_js_1.Code.Unavailable;
        case 502: // Bad Gateway
            return code_js_1.Code.Unavailable;
        case 503: // Service Unavailable
            return code_js_1.Code.Unavailable;
        case 504: // Gateway Timeout
            return code_js_1.Code.Unavailable;
        default:
            // 200 is UNKNOWN because there should be a grpc-status in case of truly OK response.
            return code_js_1.Code.Unknown;
    }
}
