import type { Compression } from "../protocol/compression.js";
import type { DescMethod } from "@bufbuild/protobuf";
/**
 * Creates headers for a Connect request.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function requestHeader(methodKind: DescMethod["methodKind"], useBinaryFormat: boolean, timeoutMs: number | undefined, userProvidedHeaders: HeadersInit | undefined, setUserAgent: boolean): Headers;
/**
 * Creates headers for a Connect request with compression.
 *
 * Note that we always set the Content-Encoding header for unary methods.
 * It is up to the caller to decide whether to apply compression - and remove
 * the header if compression is not used, for example because the payload is
 * too small to make compression effective.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function requestHeaderWithCompression(methodKind: DescMethod["methodKind"], useBinaryFormat: boolean, timeoutMs: number | undefined, userProvidedHeaders: HeadersInit | undefined, acceptCompression: Compression[], sendCompression: Compression | null, setUserAgent: boolean): Headers;
