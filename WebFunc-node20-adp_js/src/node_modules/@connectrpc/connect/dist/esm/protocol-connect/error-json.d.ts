import type { JsonObject, JsonValue, JsonWriteOptions } from "@bufbuild/protobuf";
import { ConnectError } from "../connect-error.js";
/**
 * Parse a Connect error from a JSON value.
 * Will return a ConnectError, and throw the provided fallback if parsing failed.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function errorFromJson(jsonValue: JsonValue, metadata: HeadersInit | undefined, fallback: ConnectError): ConnectError;
/**
 * Parse a Connect error from a serialized JSON value.
 * Will return a ConnectError, and throw the provided fallback if parsing failed.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function errorFromJsonBytes(bytes: Uint8Array, metadata: HeadersInit | undefined, fallback: ConnectError): ConnectError;
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
export declare function errorToJson(error: ConnectError, jsonWriteOptions: Partial<JsonWriteOptions> | undefined): JsonObject;
/**
 * Serialize the given error to JSON. This calls errorToJson(), but stringifies
 * the result, and converts it into a UInt8Array.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function errorToJsonBytes(error: ConnectError, jsonWriteOptions: Partial<JsonWriteOptions> | undefined): Uint8Array;
