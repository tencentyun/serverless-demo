/**
 * Regular Expression that matches any valid gRPC Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const contentTypeRegExp: RegExp;
export declare const contentTypeProto = "application/grpc+proto";
export declare const contentTypeJson = "application/grpc+json";
/**
 * Parse a gRPC Content-Type header.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function parseContentType(contentType: string | null): {
    binary: boolean;
} | undefined;
