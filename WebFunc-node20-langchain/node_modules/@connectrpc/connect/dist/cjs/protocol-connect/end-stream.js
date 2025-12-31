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
exports.endStreamFlag = void 0;
exports.endStreamFromJson = endStreamFromJson;
exports.endStreamToJson = endStreamToJson;
exports.createEndStreamSerialization = createEndStreamSerialization;
const error_json_js_1 = require("./error-json.js");
const http_headers_js_1 = require("../http-headers.js");
const connect_error_js_1 = require("../connect-error.js");
const code_js_1 = require("../code.js");
/**
 * endStreamFlag indicates that the data in a EnvelopedMessage
 * is a EndStreamResponse of the Connect protocol.
 *
 * @private Internal code, does not follow semantic versioning.
 */
exports.endStreamFlag = 0b00000010;
/**
 * Parse an EndStreamResponse of the Connect protocol.
 * Throws a ConnectError on malformed input.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function endStreamFromJson(data) {
    const parseErr = new connect_error_js_1.ConnectError("invalid end stream", code_js_1.Code.Unknown);
    let jsonValue;
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        jsonValue = JSON.parse(typeof data == "string" ? data : new TextDecoder().decode(data));
    }
    catch (e) {
        throw parseErr;
    }
    if (typeof jsonValue != "object" ||
        jsonValue == null ||
        Array.isArray(jsonValue)) {
        throw parseErr;
    }
    const metadata = new Headers();
    if ("metadata" in jsonValue) {
        if (typeof jsonValue.metadata != "object" ||
            jsonValue.metadata == null ||
            Array.isArray(jsonValue.metadata)) {
            throw parseErr;
        }
        for (const [key, values] of Object.entries(jsonValue.metadata)) {
            if (!Array.isArray(values) ||
                values.some((value) => typeof value != "string")) {
                throw parseErr;
            }
            for (const value of values) {
                metadata.append(key, value);
            }
        }
    }
    const error = "error" in jsonValue && jsonValue.error != null
        ? (0, error_json_js_1.errorFromJson)(jsonValue.error, metadata, parseErr)
        : undefined;
    return { metadata, error };
}
/**
 * Serialize the given EndStreamResponse to JSON.
 *
 * The JSON serialization options are required to produce the optional
 * human-readable representation of error details if the detail uses
 * google.protobuf.Any.
 *
 * See https://connectrpc.com/docs/protocol#error-end-stream
 *
 * @private Internal code, does not follow semantic versioning.
 */
function endStreamToJson(metadata, error, jsonWriteOptions) {
    const es = {};
    if (error !== undefined) {
        es.error = (0, error_json_js_1.errorToJson)(error, jsonWriteOptions);
        metadata = (0, http_headers_js_1.appendHeaders)(metadata, error.metadata);
    }
    let hasMetadata = false;
    const md = {};
    metadata.forEach((value, key) => {
        hasMetadata = true;
        md[key] = [value];
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (hasMetadata) {
        es.metadata = md;
    }
    return es;
}
/**
 * Create a Serialization object that serializes a Connect EndStreamResponse.
 *
 * @private Internal code, does not follow semantic versioning.
 */
function createEndStreamSerialization(options) {
    const textEncoder = new TextEncoder();
    return {
        serialize(data) {
            try {
                const jsonObject = endStreamToJson(data.metadata, data.error, options);
                const jsonString = JSON.stringify(jsonObject);
                return textEncoder.encode(jsonString);
            }
            catch (e) {
                const m = e instanceof Error ? e.message : String(e);
                throw new connect_error_js_1.ConnectError(`failed to serialize EndStreamResponse: ${m}`, code_js_1.Code.Internal);
            }
        },
        parse(data) {
            try {
                return endStreamFromJson(data);
            }
            catch (e) {
                const m = e instanceof Error ? e.message : String(e);
                throw new connect_error_js_1.ConnectError(`failed to parse EndStreamResponse: ${m}`, code_js_1.Code.InvalidArgument);
            }
        },
    };
}
