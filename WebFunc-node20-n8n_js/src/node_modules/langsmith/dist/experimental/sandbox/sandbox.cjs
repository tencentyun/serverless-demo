"use strict";
/**
 * Sandbox class for interacting with a specific sandbox instance.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sandbox = void 0;
const errors_js_1 = require("./errors.cjs");
const helpers_js_1 = require("./helpers.cjs");
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
class Sandbox {
    /** @internal */
    constructor(data, client) {
        /** Display name (can be updated). */
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Name of the template used to create this sandbox. */
        Object.defineProperty(this, "template_name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** URL for data plane operations (file I/O, command execution). */
        Object.defineProperty(this, "dataplane_url", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Unique identifier (UUID). Remains constant even if name changes. */
        Object.defineProperty(this, "id", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Timestamp when the sandbox was created. */
        Object.defineProperty(this, "created_at", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        /** Timestamp when the sandbox was last updated. */
        Object.defineProperty(this, "updated_at", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "_client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.name = data.name;
        this.template_name = data.template_name;
        this.dataplane_url = data.dataplane_url;
        this.id = data.id;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        this._client = client;
    }
    /**
     * Validate and return the dataplane URL.
     * @throws LangSmithDataplaneNotConfiguredError if dataplane_url is not configured.
     */
    requireDataplaneUrl() {
        if (!this.dataplane_url) {
            throw new errors_js_1.LangSmithDataplaneNotConfiguredError(`Sandbox '${this.name}' does not have a dataplane_url configured. ` +
                "Runtime operations require a dataplane URL.");
        }
        return this.dataplane_url;
    }
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
    async run(command, options = {}) {
        const { timeout = 60, env, cwd, shell = "/bin/bash" } = options;
        const dataplaneUrl = this.requireDataplaneUrl();
        const url = `${dataplaneUrl}/execute`;
        const payload = {
            command,
            timeout,
            shell,
        };
        if (env !== undefined) {
            payload.env = env;
        }
        if (cwd !== undefined) {
            payload.cwd = cwd;
        }
        const response = await this._client._fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout((timeout + 10) * 1000),
        });
        if (!response.ok) {
            await (0, helpers_js_1.handleSandboxHttpError)(response);
        }
        const data = await response.json();
        return {
            stdout: data.stdout ?? "",
            stderr: data.stderr ?? "",
            exit_code: data.exit_code ?? -1,
        };
    }
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
    async write(path, content, timeout = 60) {
        const dataplaneUrl = this.requireDataplaneUrl();
        const url = `${dataplaneUrl}/upload?path=${encodeURIComponent(path)}`;
        // Ensure content is bytes for multipart upload
        const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
        const formData = new FormData();
        // Create a copy to ensure we have a plain ArrayBuffer (not SharedArrayBuffer)
        const buffer = new Uint8Array(bytes).buffer;
        const blob = new Blob([buffer], { type: "application/octet-stream" });
        formData.append("file", blob, "file");
        const response = await this._client._fetch(url, {
            method: "POST",
            body: formData,
            signal: AbortSignal.timeout(timeout * 1000),
        });
        if (!response.ok) {
            await (0, helpers_js_1.handleSandboxHttpError)(response);
        }
    }
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
    async read(path, timeout = 60) {
        const dataplaneUrl = this.requireDataplaneUrl();
        const url = `${dataplaneUrl}/download?path=${encodeURIComponent(path)}`;
        const response = await this._client._fetch(url, {
            method: "GET",
            signal: AbortSignal.timeout(timeout * 1000),
        });
        if (!response.ok) {
            await (0, helpers_js_1.handleSandboxHttpError)(response);
        }
        const buffer = await response.arrayBuffer();
        return new Uint8Array(buffer);
    }
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
    async delete() {
        await this._client.deleteSandbox(this.name);
    }
}
exports.Sandbox = Sandbox;
