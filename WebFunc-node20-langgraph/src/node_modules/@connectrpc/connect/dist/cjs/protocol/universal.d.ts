import type { JsonValue } from "@bufbuild/protobuf";
import type { ContextValues } from "../context-values.js";
/**
 * A minimal abstraction of an HTTP client.
 */
export type UniversalClientFn = (request: UniversalClientRequest) => Promise<UniversalClientResponse>;
/**
 * A minimal abstraction of an HTTP request on the client side.
 */
export interface UniversalClientRequest {
    url: string;
    method: string;
    header: Headers;
    body?: AsyncIterable<Uint8Array>;
    signal?: AbortSignal;
}
/**
 * A minimal abstraction of an HTTP request on the client side.
 */
export interface UniversalClientResponse {
    status: number;
    header: Headers;
    body: AsyncIterable<Uint8Array>;
    trailer: Headers;
}
/**
 * A minimal abstraction of an HTTP handler.
 */
export type UniversalHandlerFn = (request: UniversalServerRequest) => Promise<UniversalServerResponse>;
/**
 * A minimal abstraction of an HTTP request on the server side.
 */
export interface UniversalServerRequest {
    httpVersion: string;
    url: string;
    method: string;
    header: Headers;
    /**
     * Many server frameworks parse request bodies with the mime type
     * application/json automatically. We accept a JSON value as an
     * alternative to a byte stream here so that this situation can be
     * handled efficiently.
     */
    body: AsyncIterable<Uint8Array> | JsonValue;
    signal: AbortSignal;
    contextValues?: ContextValues;
}
/**
 * A minimal abstraction of an HTTP response on the server side.
 */
export interface UniversalServerResponse {
    status: number;
    header?: Headers;
    body?: AsyncIterable<Uint8Array>;
    trailer?: Headers;
}
/**
 * Assert that the given UniversalServerRequest has a byte stream body, not
 * a JSON value.
 *
 * We accept a JSON object or a byte stream in server requests.
 * In practice, only Connect unary handlers will receive a parse
 * JSON object. Other call-sites can use this assertion to narrow
 * the union type. A failure in such a call-sites indicates that
 * the contract between a server framework and the connect-node \
 * handler is broken.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function assertByteStreamRequest(req: UniversalServerRequest): asserts req is Omit<UniversalServerRequest, "body"> & {
    body: AsyncIterable<Uint8Array>;
};
/**
 * HTTP 200 OK
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const uResponseOk: Readonly<UniversalServerResponse>;
/**
 * HTTP 404 Not Found
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const uResponseNotFound: Readonly<UniversalServerResponse>;
/**
 * HTTP 415 Unsupported Media Type
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const uResponseUnsupportedMediaType: Readonly<UniversalServerResponse>;
/**
 * HTTP 405 Method Not Allowed
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const uResponseMethodNotAllowed: Readonly<UniversalServerResponse>;
/**
 * HTTP 505 Version Not Supported
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const uResponseVersionNotSupported: Readonly<UniversalServerResponse>;
