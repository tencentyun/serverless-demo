import { Code } from "./code.js";
import type { Message, JsonValue, DescMessage, MessageShape, Registry, MessageInitShape } from "@bufbuild/protobuf";
/**
 * ConnectError captures four pieces of information: a Code, an error
 * message, an optional cause of the error, and an optional collection of
 * arbitrary Protobuf messages called  "details".
 *
 * Because developer tools typically show just the error message, we prefix
 * it with the status code, so that the most important information is always
 * visible immediately.
 *
 * Error details are wrapped with google.protobuf.Any on the wire, so that
 * a server or middleware can attach arbitrary data to an error. Use the
 * method findDetails() to retrieve the details.
 */
export declare class ConnectError extends Error {
    /**
     * The Code for this error.
     */
    readonly code: Code;
    /**
     * A union of response headers and trailers associated with this error.
     */
    readonly metadata: Headers;
    /**
     * When an error is parsed from the wire, incoming error details are stored
     * in this property. They can be retrieved using findDetails().
     *
     * When an error is constructed to be sent over the wire, outgoing error
     * details are stored in this property as well.
     */
    details: (OutgoingDetail | IncomingDetail)[];
    /**
     * The error message, but without a status code in front.
     *
     * For example, a new `ConnectError("hello", Code.NotFound)` will have
     * the message `[not found] hello`, and the rawMessage `hello`.
     */
    readonly rawMessage: string;
    name: string;
    /**
     * The underlying cause of this error, if any. In cases where the actual cause
     * is elided with the error message, the cause is specified here so that we
     * don't leak the underlying error, but instead make it available for logging.
     */
    cause: unknown;
    /**
     * Create a new ConnectError.
     * If no code is provided, code "unknown" is used.
     * Outgoing details are only relevant for the server side - a service may
     * raise an error with details, and it is up to the protocol implementation
     * to encode and send the details along with error.
     */
    constructor(message: string, code?: Code, metadata?: HeadersInit, outgoingDetails?: OutgoingDetail[], cause?: unknown);
    /**
     * Convert any value - typically a caught error into a ConnectError,
     * following these rules:
     * - If the value is already a ConnectError, return it as is.
     * - If the value is an AbortError from the fetch API, return the message
     *   of the AbortError with code Canceled.
     * - For other Errors, return the error message with code Unknown by default.
     * - For other values, return the values String representation as a message,
     *   with the code Unknown by default.
     * The original value will be used for the "cause" property for the new
     * ConnectError.
     */
    static from(reason: unknown, code?: Code): ConnectError;
    static [Symbol.hasInstance](v: unknown): boolean;
    /**
     * Retrieve error details from a ConnectError. On the wire, error details are
     * wrapped with google.protobuf.Any, so that a server or middleware can attach
     * arbitrary data to an error. This function decodes the array of error details
     * from the ConnectError object, and returns an array with the decoded
     * messages. Any decoding errors are ignored, and the detail will simply be
     * omitted from the list.
     */
    findDetails<Desc extends DescMessage>(desc: Desc): MessageShape<Desc>[];
    findDetails(registry: Registry): Message[];
}
/**
 * An incoming detail is basically a google.protobuf.Any, but it includes an
 * optional JSON representation in the "debug" key, and stores a type name
 * instead of a type URL.
 */
type IncomingDetail = {
    type: string;
    value: Uint8Array;
    debug?: JsonValue;
};
/**
 * Message and Desc Pair.
 */
type OutgoingDetail = {
    desc: DescMessage;
    value: MessageInitShape<DescMessage>;
};
export {};
