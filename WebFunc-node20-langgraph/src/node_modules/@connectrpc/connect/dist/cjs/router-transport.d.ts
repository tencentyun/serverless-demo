import type { CommonTransportOptions } from "./protocol/transport-options.js";
import type { ConnectRouter, ConnectRouterOptions } from "./router.js";
/**
 * Creates a Transport that routes requests to the configured router. Useful for testing
 * and calling services running in the same process.
 *
 * This can be used to test both client logic by using this to stub/mock the backend,
 * and to test server logic by using this to run without needing to spin up a server.
 */
export declare function createRouterTransport(routes: (router: ConnectRouter) => void, options?: {
    transport?: Partial<CommonTransportOptions>;
    router?: ConnectRouterOptions;
}): import("./transport.js").Transport;
