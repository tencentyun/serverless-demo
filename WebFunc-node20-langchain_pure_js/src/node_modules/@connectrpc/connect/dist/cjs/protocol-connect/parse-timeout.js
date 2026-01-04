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
exports.parseTimeout = parseTimeout;
const code_js_1 = require("../code.js");
const connect_error_js_1 = require("../connect-error.js");
/**
 * Parse a Connect Timeout (Deadline) header.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function parseTimeout(value, maxTimeoutMs) {
    if (value === null) {
        return {};
    }
    const results = /^\d{1,10}$/.exec(value);
    if (results === null) {
        return {
            error: new connect_error_js_1.ConnectError(`protocol error: invalid connect timeout value: ${value}`, code_js_1.Code.InvalidArgument),
        };
    }
    const timeoutMs = parseInt(results[0]);
    if (timeoutMs > maxTimeoutMs) {
        return {
            timeoutMs: timeoutMs,
            error: new connect_error_js_1.ConnectError(`timeout ${timeoutMs}ms must be <= ${maxTimeoutMs}`, code_js_1.Code.InvalidArgument),
        };
    }
    return {
        timeoutMs: parseInt(results[0]),
    };
}
