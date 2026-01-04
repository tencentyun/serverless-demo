import type { MethodImplSpec } from "../implementation.js";
import type { UniversalHandler } from "./universal-handler.js";
/**
 * Creates a handler function for an RPC definition and an RPC implementation,
 * for one specific protocol.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export interface ProtocolHandlerFactory {
    /**
     * Create a new handler with the user-provided implementation of the procedure.
     */
    (spec: MethodImplSpec): UniversalHandler;
    /**
     * The name of the protocol that the created handlers implement.
     */
    protocolName: string;
}
