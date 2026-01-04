import type { BinaryReadOptions, BinaryWriteOptions, JsonReadOptions, JsonWriteOptions } from "@bufbuild/protobuf";
import type { Interceptor, Transport } from "@connectrpc/connect";
/**
 * Options used to configure the gRPC-web transport.
 *
 * See createGrpcWebTransport().
 */
export interface GrpcWebTransportOptions {
    /**
     * Base URI for all HTTP requests.
     *
     * Requests will be made to <baseUrl>/<package>.<service>/method
     *
     * Example: `baseUrl: "https://example.com/my-api"`
     *
     * This will make a `POST /my-api/my_package.MyService/Foo` to
     * `example.com` via HTTPS.
     *
     * If your API is served from the same domain as your site, use
     * `baseUrl: window.location.origin` or simply "/".
     */
    baseUrl: string;
    /**
     * By default, clients use the binary format for gRPC-web, because
     * not all gRPC-web implementations support JSON.
     */
    useBinaryFormat?: boolean;
    /**
     * Interceptors that should be applied to all calls running through
     * this transport. See the Interceptor type for details.
     */
    interceptors?: Interceptor[];
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
     * Optional override of the fetch implementation used by the transport.
     *
     * This option can be used to set fetch options such as "credentials".
     */
    fetch?: typeof globalThis.fetch;
    /**
     * The timeout in milliseconds to apply to all requests.
     *
     * This can be overridden on a per-request basis by passing a timeoutMs.
     */
    defaultTimeoutMs?: number;
}
/**
 * Create a Transport for the gRPC-web protocol. The protocol encodes
 * trailers in the response body and makes unary and server-streaming
 * methods available to web browsers. It uses the fetch API to make
 * HTTP requests.
 *
 * Note that this transport does not implement the grpc-web-text format,
 * which applies base64 encoding to the request and response bodies to
 * support reading streaming responses from an XMLHttpRequest.
 */
export declare function createGrpcWebTransport(options: GrpcWebTransportOptions): Transport;
