/**
 * Validates a trailer for the gRPC and the gRPC-web protocol.
 *
 * If the trailer contains an error status, a ConnectError is
 * thrown. It will include trailer and header in the error's
 * "metadata" property.
 *
 * Throws a ConnectError with code "internal" if neither the trailer
 * nor the header contain the Grpc-Status field.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function validateTrailer(trailer: Headers, header: Headers): void;
