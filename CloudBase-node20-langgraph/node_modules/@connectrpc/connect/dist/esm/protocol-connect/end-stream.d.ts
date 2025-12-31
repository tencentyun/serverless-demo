import type { JsonObject, JsonWriteOptions } from "@bufbuild/protobuf";
import { ConnectError } from "../connect-error.js";
import type { Serialization } from "../protocol/serialization.js";
/**
 * endStreamFlag indicates that the data in a EnvelopedMessage
 * is a EndStreamResponse of the Connect protocol.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const endStreamFlag = 2;
/**
 * Represents the EndStreamResponse of the Connect protocol.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export interface EndStreamResponse {
    metadata: Headers;
    error?: ConnectError;
}
/**
 * Parse an EndStreamResponse of the Connect protocol.
 * Throws a ConnectError on malformed input.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function endStreamFromJson(data: Uint8Array | string): EndStreamResponse;
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
export declare function endStreamToJson(metadata: Headers, error: ConnectError | undefined, jsonWriteOptions: Partial<JsonWriteOptions> | undefined): JsonObject;
/**
 * Create a Serialization object that serializes a Connect EndStreamResponse.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createEndStreamSerialization(options: Partial<JsonWriteOptions> | undefined): Serialization<EndStreamResponse>;
