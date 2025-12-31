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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorFromJson = errorFromJson;
exports.errorFromJsonBytes = errorFromJsonBytes;
exports.errorToJson = errorToJson;
exports.errorToJsonBytes = errorToJsonBytes;
const wire_1 = require("@bufbuild/protobuf/wire");
const protobuf_1 = require("@bufbuild/protobuf");
const code_js_1 = require("../code.js");
const connect_error_js_1 = require("../connect-error.js");
const code_string_js_1 = require("./code-string.js");
/**
 * Parse a Connect error from a JSON value.
 * Will return a ConnectError, and throw the provided fallback if parsing failed.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function errorFromJson(jsonValue, metadata, fallback) {
    var _a;
    if (metadata) {
        new Headers(metadata).forEach((value, key) => fallback.metadata.append(key, value));
    }
    if (typeof jsonValue !== "object" ||
        jsonValue == null ||
        Array.isArray(jsonValue)) {
        throw fallback;
    }
    let code = fallback.code;
    if ("code" in jsonValue && typeof jsonValue.code === "string") {
        code = (_a = (0, code_string_js_1.codeFromString)(jsonValue.code)) !== null && _a !== void 0 ? _a : code;
    }
    const message = jsonValue.message;
    if (message != null && typeof message !== "string") {
        throw fallback;
    }
    const error = new connect_error_js_1.ConnectError(message !== null && message !== void 0 ? message : "", code, metadata);
    if ("details" in jsonValue && Array.isArray(jsonValue.details)) {
        for (const detail of jsonValue.details) {
            if (detail === null ||
                typeof detail != "object" ||
                Array.isArray(detail) ||
                typeof detail.type != "string" ||
                typeof detail.value != "string") {
                throw fallback;
            }
            try {
                error.details.push({
                    type: detail.type,
                    value: (0, wire_1.base64Decode)(detail.value),
                    debug: detail.debug,
                });
            }
            catch (e) {
                throw fallback;
            }
        }
    }
    return error;
}
/**
 * Parse a Connect error from a serialized JSON value.
 * Will return a ConnectError, and throw the provided fallback if parsing failed.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function errorFromJsonBytes(bytes, metadata, fallback) {
    let jsonValue;
    try {
        jsonValue = JSON.parse(new TextDecoder().decode(bytes));
    }
    catch (e) {
        throw fallback;
    }
    return errorFromJson(jsonValue, metadata, fallback);
}
/**
 * Serialize the given error to JSON.
 *
 * The JSON serialization options are required to produce the optional
 * human-readable representation in the "debug" key if the detail uses
 * google.protobuf.Any. If serialization of the "debug" value fails, it
 * is silently disregarded.
 *
 * See https://connectrpc.com/docs/protocol#error-end-stream
 *
 * @private Internal code, does not follow semantic versioning.
 */
function errorToJson(error, jsonWriteOptions) {
    const o = {
        code: (0, code_string_js_1.codeToString)(error.code),
    };
    if (error.rawMessage.length > 0) {
        o.message = error.rawMessage;
    }
    if (error.details.length > 0) {
        o.details = error.details
            .map((detail) => {
            if ("desc" in detail) {
                const msg = (0, protobuf_1.create)(detail.desc, detail.value);
                const i = {
                    type: detail.desc.typeName,
                    value: (0, protobuf_1.toBinary)(detail.desc, msg),
                };
                try {
                    i.debug = (0, protobuf_1.toJson)(detail.desc, msg, jsonWriteOptions);
                }
                catch (e) {
                    // We deliberately ignore errors that may occur when serializing
                    // a message to JSON (the message contains an Any).
                    // The rationale is that we are only trying to provide optional
                    // debug information.
                }
                return i;
            }
            return detail;
        })
            .map((_a) => {
            var { value } = _a, rest = __rest(_a, ["value"]);
            return (Object.assign(Object.assign({}, rest), { value: (0, wire_1.base64Encode)(value, "std_raw") }));
        });
    }
    return o;
}
/**
 * Serialize the given error to JSON. This calls errorToJson(), but stringifies
 * the result, and converts it into a UInt8Array.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function errorToJsonBytes(error, jsonWriteOptions) {
    const textEncoder = new TextEncoder();
    try {
        const jsonObject = errorToJson(error, jsonWriteOptions);
        const jsonString = JSON.stringify(jsonObject);
        return textEncoder.encode(jsonString);
    }
    catch (e) {
        const m = e instanceof Error ? e.message : String(e);
        throw new connect_error_js_1.ConnectError(`failed to serialize Connect Error: ${m}`, code_js_1.Code.Internal);
    }
}
