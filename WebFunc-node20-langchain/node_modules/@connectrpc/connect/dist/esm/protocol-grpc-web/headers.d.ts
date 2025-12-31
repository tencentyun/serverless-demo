/**
 * @private Internal code, does not follow semantic versioning.
 */
export { headerContentType, headerEncoding, headerAcceptEncoding, headerTimeout, headerGrpcStatus, headerGrpcMessage, headerStatusDetailsBin, headerUserAgent, } from "../protocol-grpc/headers.js";
/**
 * gRPC-web does not use the standard header User-Agent.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const headerXUserAgent = "X-User-Agent";
/**
 * The canonical grpc/grpc-web JavaScript implementation sets
 * this request header with value "1".
 * Some servers may rely on the header to identify gRPC-web
 * requests. For example the proxy by improbable:
 * https://github.com/improbable-eng/grpc-web/blob/53aaf4cdc0fede7103c1b06f0cfc560c003a5c41/go/grpcweb/wrapper.go#L231
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const headerXGrpcWeb = "X-Grpc-Web";
