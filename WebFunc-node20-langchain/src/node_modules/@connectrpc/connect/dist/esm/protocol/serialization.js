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
import { fromBinary, fromJsonString, toBinary, toJsonString, } from "@bufbuild/protobuf";
import { ConnectError } from "../connect-error.js";
import { Code } from "../code.js";
import { assertReadMaxBytes, assertWriteMaxBytes } from "./limit-io.js";
/**
 * Sets default JSON serialization options for connect-es.
 *
 * With standard protobuf JSON serialization, unknown JSON fields are
 * rejected by default. In connect-es, unknown JSON fields are ignored
 * by default.
 */
export function getJsonOptions(options) {
    var _a;
    const o = Object.assign({}, options);
    (_a = o.ignoreUnknownFields) !== null && _a !== void 0 ? _a : (o.ignoreUnknownFields = true);
    return o;
}
/**
 * Create an object that provides convenient access to request and response
 * message serialization for a given method.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function createMethodSerializationLookup(method, binaryOptions, jsonOptions, limitOptions) {
    const inputBinary = limitSerialization(createBinarySerialization(method.input, binaryOptions), limitOptions);
    const inputJson = limitSerialization(createJsonSerialization(method.input, jsonOptions), limitOptions);
    const outputBinary = limitSerialization(createBinarySerialization(method.output, binaryOptions), limitOptions);
    const outputJson = limitSerialization(createJsonSerialization(method.output, jsonOptions), limitOptions);
    return {
        getI(useBinaryFormat) {
            return useBinaryFormat ? inputBinary : inputJson;
        },
        getO(useBinaryFormat) {
            return useBinaryFormat ? outputBinary : outputJson;
        },
    };
}
/**
 * Returns functions to normalize and serialize the input message
 * of an RPC, and to parse the output message of an RPC.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function createClientMethodSerializers(method, useBinaryFormat, jsonOptions, binaryOptions) {
    const input = useBinaryFormat
        ? createBinarySerialization(method.input, binaryOptions)
        : createJsonSerialization(method.input, jsonOptions);
    const output = useBinaryFormat
        ? createBinarySerialization(method.output, binaryOptions)
        : createJsonSerialization(method.output, jsonOptions);
    return { parse: output.parse, serialize: input.serialize };
}
/**
 * Apply I/O limits to a Serialization object, returning a new object.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export function limitSerialization(serialization, limitOptions) {
    return {
        serialize(data) {
            const bytes = serialization.serialize(data);
            assertWriteMaxBytes(limitOptions.writeMaxBytes, bytes.byteLength);
            return bytes;
        },
        parse(data) {
            assertReadMaxBytes(limitOptions.readMaxBytes, data.byteLength, true);
            return serialization.parse(data);
        },
    };
}
/**
 * Creates a Serialization object for serializing the given protobuf message
 * with the protobuf binary format.
 */
export function createBinarySerialization(desc, options) {
    return {
        parse(data) {
            try {
                return fromBinary(desc, data, options);
            }
            catch (e) {
                const m = e instanceof Error ? e.message : String(e);
                throw new ConnectError(`parse binary: ${m}`, Code.Internal);
            }
        },
        serialize(data) {
            try {
                return toBinary(desc, data, options);
            }
            catch (e) {
                const m = e instanceof Error ? e.message : String(e);
                throw new ConnectError(`serialize binary: ${m}`, Code.Internal);
            }
        },
    };
}
/**
 * Creates a Serialization object for serializing the given protobuf message
 * with the protobuf canonical JSON encoding.
 *
 * By default, unknown fields are ignored.
 */
export function createJsonSerialization(desc, options) {
    var _a, _b;
    const textEncoder = (_a = options === null || options === void 0 ? void 0 : options.textEncoder) !== null && _a !== void 0 ? _a : new TextEncoder();
    const textDecoder = (_b = options === null || options === void 0 ? void 0 : options.textDecoder) !== null && _b !== void 0 ? _b : new TextDecoder();
    const o = getJsonOptions(options);
    return {
        parse(data) {
            try {
                const json = textDecoder.decode(data);
                return fromJsonString(desc, json, o);
            }
            catch (e) {
                throw ConnectError.from(e, Code.InvalidArgument);
            }
        },
        serialize(data) {
            try {
                const json = toJsonString(desc, data, o);
                return textEncoder.encode(json);
            }
            catch (e) {
                throw ConnectError.from(e, Code.Internal);
            }
        },
    };
}
