/**
 * Regular Expression that matches any valid gRPC-web Content-Type header value.
 * Note that this includes application/grpc-web-text with the additional base64
 * encoding.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const contentTypeRegExp: RegExp;
export declare const contentTypeProto = "application/grpc-web+proto";
export declare const contentTypeJson = "application/grpc-web+json";
/**
 * Parse a gRPC-web Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function parseContentType(contentType: string | null): {
    text: boolean;
    binary: boolean;
} | undefined;
