import type { Compression } from "../protocol/compression.js";
/**
 * Creates headers for a gRPC request.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function requestHeader(useBinaryFormat: boolean, timeoutMs: number | undefined, userProvidedHeaders: HeadersInit | undefined): Headers;
/**
 * Creates headers for a gRPC request with compression.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function requestHeaderWithCompression(useBinaryFormat: boolean, timeoutMs: number | undefined, userProvidedHeaders: HeadersInit | undefined, acceptCompression: Compression[], sendCompression: Compression | null): Headers;
