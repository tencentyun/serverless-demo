import type { ProtocolHandlerFactory } from "../protocol/protocol-handler-factory.js";
import type { UniversalHandlerOptions } from "../protocol/universal-handler.js";
/**
 * Create a factory that creates gRPC handlers.
 */
export declare function createHandlerFactory(options: Partial<UniversalHandlerOptions>): ProtocolHandlerFactory;
