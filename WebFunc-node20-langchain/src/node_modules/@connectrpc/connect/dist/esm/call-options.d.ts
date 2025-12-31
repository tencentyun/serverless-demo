import type { ContextValues } from "./context-values.js";
/**
 * Options for a call. Every client should accept CallOptions as optional
 * argument in its RPC methods.
 */
export interface CallOptions {
    /**
     * Timeout in milliseconds.
     *
     * Set to <= 0 to disable the default timeout.
     */
    timeoutMs?: number;
    /**
     * Custom headers to send with the request.
     */
    headers?: HeadersInit;
    /**
     * An optional AbortSignal to cancel the call.
     * If cancelled, an error with Code.Canceled is raised.
     */
    signal?: AbortSignal;
    /**
     * Called when response headers are received.
     */
    onHeader?(headers: Headers): void;
    /**
     * Called when response trailers are received.
     */
    onTrailer?(trailers: Headers): void;
    /**
     * ContextValues to pass to the interceptors.
     */
    contextValues?: ContextValues;
}
