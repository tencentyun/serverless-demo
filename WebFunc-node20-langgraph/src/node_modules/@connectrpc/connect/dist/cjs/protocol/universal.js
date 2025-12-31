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
exports.uResponseVersionNotSupported = exports.uResponseMethodNotAllowed = exports.uResponseUnsupportedMediaType = exports.uResponseNotFound = exports.uResponseOk = void 0;
exports.assertByteStreamRequest = assertByteStreamRequest;
/**
 * Assert that the given UniversalServerRequest has a byte stream body, not
 * a JSON value.
 *
 * We accept a JSON object or a byte stream in server requests.
 * In practice, only Connect unary handlers will receive a parse
 * JSON object. Other call-sites can use this assertion to narrow
 * the union type. A failure in such a call-sites indicates that
 * the contract between a server framework and the connect-node \
 * handler is broken.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function assertByteStreamRequest(req) {
    if (typeof req.body == "object" &&
        req.body !== null &&
        Symbol.asyncIterator in req.body) {
        return;
    }
    throw new Error("byte stream required, but received JSON");
}
/**
 * HTTP 200 OK
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.uResponseOk = {
    status: 200,
};
/**
 * HTTP 404 Not Found
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.uResponseNotFound = {
    status: 404,
};
/**
 * HTTP 415 Unsupported Media Type
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.uResponseUnsupportedMediaType = {
    status: 415,
};
/**
 * HTTP 405 Method Not Allowed
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.uResponseMethodNotAllowed = {
    status: 405,
};
/**
 * HTTP 505 Version Not Supported
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.uResponseVersionNotSupported = {
    status: 505,
};
