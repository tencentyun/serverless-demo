import type { UniversalHandlerOptions } from "../protocol/universal-handler.js";
import type { ProtocolHandlerFactory } from "../protocol/protocol-handler-factory.js";
/**
 * Create a factory that creates Connect handlers.
 */
export declare function createHandlerFactory(options: Partial<UniversalHandlerOptions>): ProtocolHandlerFactory;
