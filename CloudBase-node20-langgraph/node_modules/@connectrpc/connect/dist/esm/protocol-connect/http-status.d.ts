import { Code } from "../code.js";
/**
 * Determine the Connect error code for the given HTTP status code.
 * See https://connectrpc.com/docs/protocol/#http-to-error-code
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function codeFromHttpStatus(httpStatus: number): Code;
/**
 * Returns a HTTP status code for the given Connect code.
 * See https://connectrpc.com/docs/protocol#error-codes
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function codeToHttpStatus(code: Code): number;
