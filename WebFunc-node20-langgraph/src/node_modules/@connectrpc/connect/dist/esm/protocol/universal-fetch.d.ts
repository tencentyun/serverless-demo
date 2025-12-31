import type { UniversalClientFn, UniversalClientRequest, UniversalClientResponse, UniversalHandlerFn, UniversalServerRequest, UniversalServerResponse } from "./universal.js";
/**
 * Create a universal client function, a minimal abstraction of an HTTP client,
 * using the given fetch() implementation.
 */
export declare function createFetchClient(fetchFn: typeof fetch): UniversalClientFn;
/**
 * FetchHandlerFn is a minimal abstraction of an HTTP handler with the fetch API
 * Request and Response types.
 */
type FetchHandlerFn = (req: Request) => Promise<Response>;
interface FetchHandlerOptions {
    httpVersion?: string;
}
/**
 * Convert a universal handler function to a fetch handler.
 */
export declare function createFetchHandler(uHandler: UniversalHandlerFn, options?: FetchHandlerOptions): FetchHandlerFn;
/**
 * Convert a universal client request to a fetch request.
 */
export declare function universalClientRequestToFetch(req: UniversalClientRequest): Request;
/**
 * Convert a fetch response to a universal client response.
 */
export declare function universalClientResponseFromFetch(res: Response): UniversalClientResponse;
/**
 * Convert a fetch request to a universal server request.
 */
export declare function universalServerRequestFromFetch(req: Request, options: FetchHandlerOptions): UniversalServerRequest;
/**
 * Convert a universal server response to a fetch response.
 */
export declare function universalServerResponseToFetch(res: UniversalServerResponse): Response;
export {};
