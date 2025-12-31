/**
 * Regular Expression that matches any valid Connect Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const contentTypeRegExp: RegExp;
/**
 * Regular Expression that matches a Connect unary Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const contentTypeUnaryRegExp: RegExp;
/**
 * Regular Expression that matches a Connect streaming Content-Type header value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const contentTypeStreamRegExp: RegExp;
export declare const contentTypeUnaryProto = "application/proto";
export declare const contentTypeUnaryJson = "application/json";
export declare const contentTypeStreamProto = "application/connect+proto";
export declare const contentTypeStreamJson = "application/connect+json";
/**
 * Parse a Connect Content-Type header.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function parseContentType(contentType: string | null): {
    stream: boolean;
    binary: boolean;
} | undefined;
/**
 * Parse a Connect Get encoding query parameter.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function parseEncodingQuery(encoding: string | null): {
    stream: boolean;
    binary: boolean;
} | undefined;
