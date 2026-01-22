import type { Serialization } from "../protocol/serialization.js";
/**
 * trailerFlag indicates that the data in a EnvelopedMessage
 * is a set of trailers of the gRPC-web protocol.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const trailerFlag = 128;
/**
 * Parse a gRPC-web trailer, a set of header fields separated by CRLF.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function trailerParse(data: Uint8Array): Headers;
/**
 * Serialize a Headers object as a gRPC-web trailer.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function trailerSerialize(trailer: Headers): Uint8Array;
/**
 * Create a Serialization object that serializes a gRPC-web trailer, a Headers
 * object that is serialized as a set of header fields, separated by CRLF.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createTrailerSerialization(): Serialization<Headers>;
