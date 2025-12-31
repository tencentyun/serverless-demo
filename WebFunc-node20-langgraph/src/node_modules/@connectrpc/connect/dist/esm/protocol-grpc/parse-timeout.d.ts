import { ConnectError } from "../connect-error.js";
/**
 * Parse a gRPC Timeout (Deadline) header.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function parseTimeout(value: string | null, maxTimeoutMs: number): {
    timeoutMs?: number;
    error?: undefined;
} | {
    timeoutMs?: number;
    error: ConnectError;
};
