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
exports.codeToHttpStatus = codeToHttpStatus;
const code_js_1 = require("../code.js");
/**
 * Determine the Connect error code for the given HTTP status code.
 * See https://connectrpc.com/docs/protocol/#http-to-error-code
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
            return code_js_1.Code.Unknown;
    }
}
/**
 * Returns a HTTP status code for the given Connect code.
 * See https://connectrpc.com/docs/protocol#error-codes
 *
 * @private Internal code, does not follow semantic versioning.
 */
function codeToHttpStatus(code) {
    switch (code) {
        case code_js_1.Code.Canceled:
            return 499; // Client Closed Request
        case code_js_1.Code.Unknown:
            return 500; // Internal Server Error
        case code_js_1.Code.InvalidArgument:
            return 400; // Bad Request
        case code_js_1.Code.DeadlineExceeded:
            return 504; // Gateway Timeout
        case code_js_1.Code.NotFound:
            return 404; // Not Found
        case code_js_1.Code.AlreadyExists:
            return 409; // Conflict
        case code_js_1.Code.PermissionDenied:
            return 403; // Forbidden
        case code_js_1.Code.ResourceExhausted:
            return 429; // Too Many Requests
        case code_js_1.Code.FailedPrecondition:
            return 400; // Bad Request
        case code_js_1.Code.Aborted:
            return 409; // Conflict
        case code_js_1.Code.OutOfRange:
            return 400; // Bad Request
        case code_js_1.Code.Unimplemented:
            return 501; // Not Implemented
        case code_js_1.Code.Internal:
            return 500; // Internal Server Error
        case code_js_1.Code.Unavailable:
            return 503; // Service Unavailable
        case code_js_1.Code.DataLoss:
            return 500; // Internal Server Error
        case code_js_1.Code.Unauthenticated:
            return 401; // Unauthorized
        default:
            return 500; // same as CodeUnknown
    }
}
