/**
 * Sandbox class for interacting with a specific sandbox instance.
 */
import type { ExecutionResult, RunOptions } from "./types.js";
/**
 * Represents an active sandbox for running commands and file operations.
 *
 * This class is typically obtained from SandboxClient.createSandbox() and
 * provides methods for command execution and file I/O within the sandbox
 * environment.
 *
 * @example
 * ```typescript
 * const sandbox = await client.createSandbox("python-sandbox");
 * try {
 *   const result = await sandbox.run("python --version");
 *   console.log(result.stdout);
 * } finally {
 *   await sandbox.delete();
 * }
 * ```
 */
export declare class Sandbox {
    /** Display name (can be updated). */
    readonly name: string;
    /** Name of the template used to create this sandbox. */
    readonly template_name: string;
    /** URL for data plane operations (file I/O, command execution). */
    readonly dataplane_url?: string;
    /** Unique identifier (UUID). Remains constant even if name changes. */
    readonly id?: string;
    /** Timestamp when the sandbox was created. */
    readonly created_at?: string;
    /** Timestamp when the sandbox was last updated. */
    readonly updated_at?: string;
    private _client;
    /**
     * Validate and return the dataplane URL.
     * @throws LangSmithDataplaneNotConfiguredError if dataplane_url is not configured.
     */
    private requireDataplaneUrl;
    /**
     * Execute a command in the sandbox.
     *
     * @param command - Shell command to execute.
     * @param options - Execution options.
     * @returns ExecutionResult with stdout, stderr, and exit_code.
     * @throws LangSmithDataplaneNotConfiguredError if dataplane_url is not configured.
     * @throws SandboxOperationError if command execution fails.
     * @throws SandboxConnectionError if connection to sandbox fails.
     * @throws SandboxNotReadyError if sandbox is not ready.
     *
     * @example
     * ```typescript
     * const result = await sandbox.run("echo hello");
     * console.log(result.stdout); // "hello\n"
     * console.log(result.exit_code); // 0
     * ```
     */
    run(command: string, options?: RunOptions): Promise<ExecutionResult>;
    /**
     * Write content to a file in the sandbox.
     *
     * @param path - Target file path in the sandbox.
     * @param content - File content (string or bytes).
     * @param timeout - Request timeout in seconds.
     * @throws LangSmithDataplaneNotConfiguredError if dataplane_url is not configured.
     * @throws SandboxOperationError if file write fails.
     * @throws SandboxConnectionError if connection to sandbox fails.
     *
     * @example
     * ```typescript
     * await sandbox.write("/tmp/script.py", 'print("Hello!")');
     * ```
     */
    write(path: string, content: string | Uint8Array, timeout?: number): Promise<void>;
    /**
     * Read a file from the sandbox.
     *
     * @param path - File path to read. Supports both absolute paths (e.g., /tmp/file.txt)
     *               and relative paths (resolved from /home/user/).
     * @param timeout - Request timeout in seconds.
     * @returns File contents as Uint8Array.
     * @throws LangSmithDataplaneNotConfiguredError if dataplane_url is not configured.
     * @throws ResourceNotFoundError if the file doesn't exist.
     * @throws SandboxOperationError if file read fails.
     * @throws SandboxConnectionError if connection to sandbox fails.
     *
     * @example
     * ```typescript
     * const content = await sandbox.read("/tmp/output.txt");
     * const text = new TextDecoder().decode(content);
     * console.log(text);
     * ```
     */
    read(path: string, timeout?: number): Promise<Uint8Array>;
    /**
     * Delete this sandbox.
     *
     * Call this when you're done using the sandbox to clean up resources.
     *
     * @example
     * ```typescript
     * const sandbox = await client.createSandbox("python-sandbox");
     * try {
     *   await sandbox.run("echo hello");
     * } finally {
     *   await sandbox.delete();
     * }
     * ```
     */
    delete(): Promise<void>;
}
