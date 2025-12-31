import { ConnectError } from "../connect-error.js";
import type { Compression } from "../protocol/compression.js";
import type { DescMethod } from "@bufbuild/protobuf";
/**
 * Validates response status and header for the Connect protocol.
 * Throws a ConnectError if the header indicates an error, or if
 * the content type is unexpected, with the following exception:
 * For unary RPCs with an HTTP error status, this returns an error
 * derived from the HTTP status instead of throwing it, giving an
 * implementation a chance to parse a Connect error from the wire.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function validateResponse(methodKind: DescMethod["methodKind"], useBinaryFormat: boolean, status: number, headers: Headers): {
    isUnaryError: false;
    unaryError?: undefined;
} | {
    isUnaryError: true;
    unaryError: ConnectError;
};
/**
 * Validates response status and header for the Connect protocol.
 * This function is identical to validateResponse(), but also verifies
 * that a given encoding header is acceptable.
 *
 * @private
 */
export declare function validateResponseWithCompression(methodKind: DescMethod["methodKind"], acceptCompression: Compression[], useBinaryFormat: boolean, status: number, headers: Headers): ReturnType<typeof validateResponse> & {
    compression: Compression | undefined;
};
