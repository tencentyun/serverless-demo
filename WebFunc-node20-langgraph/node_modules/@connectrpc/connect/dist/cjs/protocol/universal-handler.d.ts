import type { BinaryReadOptions, BinaryWriteOptions, DescMethod, DescService, JsonReadOptions, JsonWriteOptions } from "@bufbuild/protobuf";
import type { MethodImplSpec, ServiceImplSpec } from "../implementation.js";
import type { UniversalHandlerFn } from "./universal.js";
import type { ContentTypeMatcher } from "./content-type-matcher.js";
import type { Compression } from "./compression.js";
import type { ProtocolHandlerFactory } from "./protocol-handler-factory.js";
import type { Interceptor } from "../interceptor.js";
/**
 * Common options for handlers.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export interface UniversalHandlerOptions {
    /**
     * Compression algorithms available to a server for decompressing request
     * messages, and for compressing response messages.
     */
    acceptCompression: Compression[];
    /**
     * Sets a minimum size threshold for compression: Messages that are smaller
     * than the configured minimum are sent uncompressed.
     *
     * The default value is 1 kibibyte, because the CPU cost of compressing very
     * small messages usually isn't worth the small reduction in network I/O.
     */
    compressMinBytes: number;
    /**
     * Limits the performance impact of pathologically large messages sent by the
     * client. Limits apply to each individual message, not to the stream as a
     * whole.
     *
     * The default limit is the maximum supported value of ~4GiB.
     */
    readMaxBytes: number;
    /**
     * Prevents sending messages too large for the client to handle.
     *
     * The default limit is the maximum supported value of ~4GiB.
     */
    writeMaxBytes: number;
    /**
     * Options for the JSON format.
     * By default, unknown fields are ignored.
     */
    jsonOptions?: Partial<JsonReadOptions & JsonWriteOptions>;
    /**
     * Options for the binary wire format.
     */
    binaryOptions?: Partial<BinaryReadOptions & BinaryWriteOptions>;
    /**
     * The maximum value for timeouts that clients may specify.
     * If a clients requests a timeout that is greater than maxTimeoutMs,
     * the server responds with the error code InvalidArgument.
     */
    maxTimeoutMs: number;
    /**
     * To shut down servers gracefully, this option takes an AbortSignal.
     * If this signal is aborted, all signals in handler contexts will be aborted
     * as well. This gives implementations a chance to wrap up work before the
     * server process is killed.
     * Abort this signal with a ConnectError to send a message and code to
     * clients.
     */
    shutdownSignal?: AbortSignal;
    /**
     * Require requests using the Connect protocol to include the header
     * Connect-Protocol-Version. This ensures that HTTP proxies and other
     * code inspecting traffic can easily identify Connect RPC requests,
     * even if they use a common Content-Type like application/json.
     *
     * If a Connect request does not include the Connect-Protocol-Version
     * header, an error with code invalid_argument (HTTP 400) is returned.
     * This option has no effect if the client uses the gRPC or the gRPC-web
     * protocol.
     */
    requireConnectProtocolHeader: boolean;
    /**
     * Interceptors that should be applied to all calls running through
     * this router. See the Interceptor type for details.
     */
    interceptors: Interceptor[];
}
/**
 * An HTTP handler for one specific RPC - a procedure typically defined in
 * protobuf.
 */
export interface UniversalHandler extends UniversalHandlerFn {
    /**
     * The name of the protocols this handler implements.
     */
    protocolNames: string[];
    /**
     * Information about the related protobuf service.
     */
    service: DescService;
    /**
     * Information about the method of the protobuf service.
     */
    method: DescMethod;
    /**
     * The request path of the procedure, without any prefixes.
     * For example, "/something/foo.FooService/Bar" for the method
     * "Bar" of the service "foo.FooService".
     */
    requestPath: string;
    /**
     * The HTTP request methods this procedure allows. For example, "POST".
     */
    allowedMethods: string[];
    /**
     * A matcher for Content-Type header values that this procedure supports.
     */
    supportedContentType: ContentTypeMatcher;
}
/**
 * Asserts that the options are within sane limits, and returns default values
 * where no value is provided.
 *
 * Note that this function does not set default values for `acceptCompression`.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function validateUniversalHandlerOptions(opt: Partial<UniversalHandlerOptions> | undefined): UniversalHandlerOptions;
/**
 * For the given service implementation, return a universal handler for each
 * RPC. The handler serves the given protocols.
 *
 * At least one protocol is required.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createUniversalServiceHandlers(spec: ServiceImplSpec, protocols: ProtocolHandlerFactory[]): UniversalHandler[];
/**
 * Return a universal handler for the given RPC implementation.
 * The handler serves the given protocols.
 *
 * At least one protocol is required.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createUniversalMethodHandler(spec: MethodImplSpec, protocols: ProtocolHandlerFactory[]): UniversalHandler;
/**
 * Create a universal handler that negotiates the protocol.
 *
 * This functions takes one or more handlers - all for the same RPC, but for
 * different protocols - and returns a single handler that looks at the
 * Content-Type header and the HTTP verb of the incoming request to select
 * the appropriate protocol-specific handler.
 *
 * Raises an error if no protocol handlers were provided, or if they do not
 * handle exactly the same RPC.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function negotiateProtocol(protocolHandlers: UniversalHandler[]): UniversalHandler;
