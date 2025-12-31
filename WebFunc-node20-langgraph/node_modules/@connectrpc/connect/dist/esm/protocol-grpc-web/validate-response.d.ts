import { ConnectError } from "../connect-error.js";
import type { Compression } from "../protocol/compression.js";
/**
 * Validates response status and header for the gRPC-web protocol.
 *
 * Throws a ConnectError if the header contains an error status,
 * or if the HTTP status indicates an error.
 *
 * Returns an object that indicates whether a gRPC status was found
 * in the response header. In this case, clients can not expect a
 * trailer.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function validateResponse(status: number, headers: Headers): {
    foundStatus: boolean;
    headerError?: ConnectError;
};
/**
 * Validates response status and header for the gRPC-web protocol.
 * This function is identical to validateResponse(), but also verifies
 * that a given encoding header is acceptable.
 *
 * Returns an object with the response compression, and a boolean
 * indicating whether a gRPC status was found in the response header
 * (in this case, clients can not expect a trailer).
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function validateResponseWithCompression(acceptCompression: Compression[], status: number, headers: Headers): {
    foundStatus: boolean;
    compression: Compression | undefined;
    headerError?: ConnectError;
};
