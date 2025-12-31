import { ConnectError } from "../connect-error.js";
/**
 * The value of the Grpc-Status header or trailer in case of success.
 * Used by the gRPC and gRPC-web protocols.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const grpcStatusOk = "0";
/**
 * Sets the fields "grpc-status" and "grpc-message" in the given
 * Headers object.
 * If an error is given and contains error details, the function
 * will also set the field "grpc-status-details-bin" with an encoded
 * google.rpc.Status message including the error details.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function setTrailerStatus(target: Headers, error: ConnectError | undefined): Headers;
/**
 * Find an error status in the given Headers object, which can be either
 * a trailer, or a header (as allowed for so-called trailers-only responses).
 * The field "grpc-status-details-bin" is inspected, and if not present,
 * the fields "grpc-status" and "grpc-message" are used.
 * Returns an error only if the gRPC status code is > 0.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function findTrailerError(headerOrTrailer: Headers): ConnectError | undefined;
