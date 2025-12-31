import { Code } from "../code.js";
/**
 * Determine the gRPC-web error code for the given HTTP status code.
 * See https://github.com/grpc/grpc/blob/master/doc/http-grpc-status-mapping.md.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function codeFromHttpStatus(httpStatus: number): Code;
