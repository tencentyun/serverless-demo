import type { MethodImpl, ServiceImpl } from "./implementation.js";
import type { UniversalHandler, UniversalHandlerOptions } from "./protocol/universal-handler.js";
import type { DescMethod, DescService } from "@bufbuild/protobuf";
/**
 * ConnectRouter is your single registration point for RPCs.
 *
 * Create a file `connect.ts` with a default export such as this:
 *
 * ```ts
 * import {ConnectRouter} from "@connectrpc/connect";
 *
 * export default (router: ConnectRouter) => {
 *   router.service(ElizaService, {});
 * }
 * ```
 *
 * The pass this function to adapters and plugins, for example
 * from @connectrpc/connect-node, or from @connectrpc/connect-fastify.
 */
export interface ConnectRouter {
    readonly handlers: UniversalHandler[];
    /**
     * Register a service implementation, and object with methods for the
     * individual RPCs.
     *
     * You don't have to implement all RPCs of a service. If you omit a method,
     * the router adds a method that responds with an error code `unimplemented`.
     */
    service: <T extends DescService>(service: T, implementation: Partial<ServiceImpl<T>>, options?: Partial<UniversalHandlerOptions>) => this;
    /**
     * Register a single RPC implementation.
     */
    rpc: <M extends DescMethod>(method: M, impl: MethodImpl<M>, options?: Partial<UniversalHandlerOptions>) => this;
}
/**
 * Options for a ConnectRouter. By default, all three protocols gRPC, gRPC-web,
 * and Connect are enabled.
 */
export interface ConnectRouterOptions extends Partial<UniversalHandlerOptions> {
    /**
     * Enable the gRPC protocol and make your API available to all gRPC clients
     * for various platforms and languages. See https://grpc.io/
     *
     * The protocol is enabled by default. Set this option to `false` to disable
     * it, but mind that at least one protocol must be enabled.
     *
     * Note that gRPC is typically served with TLS over HTTP/2 and requires access
     * to HTTP trailers.
     */
    grpc?: boolean;
    /**
     * Enable the gRPC-web protocol and make your API available to all gRPC-web
     * clients. gRPC-web is commonly used in web browsers, but there are client
     * implementations for other platforms as well, for example in Dart, Kotlin,
     * and Swift. See https://github.com/grpc/grpc-web
     *
     * The protocol is enabled by default. Set this option to `false` to disable
     * it, but mind that at least one protocol must be enabled.
     *
     * gRPC-web works over HTTP 1.1 or HTTP/2 and does not require access to HTTP
     * trailers. Note that bidi streaming requires HTTP/2, and web browsers may
     * not support all streaming types.
     */
    grpcWeb?: boolean;
    /**
     * Enable the Connect protocol and make your API available to all Connect
     * clients, but also for a simple call with curl. See https://connectrpc.com/
     *
     * The protocol is enabled by default. Set this option to `false` to disable
     * it, but mind that at least one protocol must be enabled.
     *
     * Connect works over HTTP 1.1 or HTTP/2 and does not require access to HTTP
     * trailers. Note that bidi streaming requires HTTP/2, and web browsers may
     * not support all streaming types.
     */
    connect?: boolean;
}
/**
 * Create a new ConnectRouter.
 */
export declare function createConnectRouter(routerOptions?: ConnectRouterOptions): ConnectRouter;
