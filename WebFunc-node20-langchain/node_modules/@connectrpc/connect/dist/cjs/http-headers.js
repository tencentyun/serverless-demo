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
exports.encodeBinaryHeader = encodeBinaryHeader;
exports.decodeBinaryHeader = decodeBinaryHeader;
exports.appendHeaders = appendHeaders;
const protobuf_1 = require("@bufbuild/protobuf");
const wire_1 = require("@bufbuild/protobuf/wire");
const connect_error_js_1 = require("./connect-error.js");
const code_js_1 = require("./code.js");
function encodeBinaryHeader(value, desc) {
    let bytes;
    if (desc !== undefined) {
        bytes = (0, protobuf_1.toBinary)(desc, value);
    }
    else if (typeof value == "string") {
        bytes = new TextEncoder().encode(value);
    }
    else {
        bytes =
            value instanceof Uint8Array
                ? value
                : new Uint8Array(value);
    }
    return (0, wire_1.base64Encode)(bytes, "std_raw");
}
function decodeBinaryHeader(value, desc, options) {
    try {
        const bytes = (0, wire_1.base64Decode)(value);
        if (desc) {
            return (0, protobuf_1.fromBinary)(desc, bytes, options);
        }
        return bytes;
    }
    catch (e) {
        throw connect_error_js_1.ConnectError.from(e, code_js_1.Code.DataLoss);
    }
}
/**
 * Merge two or more Headers objects by appending all fields from
 * all inputs to a new Headers object.
 */
function appendHeaders(...headers) {
    const h = new Headers();
    for (const e of headers) {
        e.forEach((value, key) => {
            h.append(key, value);
        });
    }
    return h;
}
