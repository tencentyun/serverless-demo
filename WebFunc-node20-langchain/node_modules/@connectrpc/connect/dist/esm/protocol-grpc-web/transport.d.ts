import type { CommonTransportOptions } from "../protocol/transport-options.js";
import type { Transport } from "../transport.js";
/**
 * Create a Transport for the gRPC-web protocol.
 */
export declare function createTransport(opt: CommonTransportOptions): Transport;
