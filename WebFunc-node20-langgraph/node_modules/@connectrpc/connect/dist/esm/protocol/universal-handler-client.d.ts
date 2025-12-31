import type { UniversalHandler } from "./universal-handler.js";
import type { UniversalClientFn } from "./universal.js";
/**
 * An in-memory UniversalClientFn that can be used to route requests to a ConnectRouter
 * bypassing network calls. Useful for testing and calling in-process services.
 */
export declare function createUniversalHandlerClient(uHandlers: UniversalHandler[]): UniversalClientFn;
