import type { BinaryReadOptions, DescMessage, Message, MessageShape } from "@bufbuild/protobuf";
/**
 * Encode a single binary header value according to the Connect
 * and gRPC specifications.
 *
 * This function accepts raw binary data from a buffer, a string
 * with UTF-8 text, or a protobuf message. It encodes the input
 * with unpadded base64 and returns a string that can be used for
 * a header whose name ends with `-bin`.
 */
export declare function encodeBinaryHeader(value: Message, desc: DescMessage): string;
export declare function encodeBinaryHeader(value: Uint8Array | ArrayBufferLike | string): string;
/**
 * Decode a single binary header value according to the Connect
 * and gRPC specifications.
 *
 * This function returns the raw binary data from a header whose
 * name ends with `-bin`. If given a message type in the second
 * argument, it deserializes a protobuf message. To decode a value
 * that contains unicode text, pass the raw binary data returned
 * from this function through TextDecoder.decode.
 *
 * Note that duplicate header names may have their values joined
 * with a `,` as the delimiter, so you most likely will want to
 * split by `,` first.
 *
 * If this function detects invalid base-64 encoding, or invalid
 * binary message data, it throws a ConnectError with code
 * DataLoss.
 */
export declare function decodeBinaryHeader(value: string): Uint8Array;
export declare function decodeBinaryHeader<Desc extends DescMessage>(value: string, type: Desc, options?: Partial<BinaryReadOptions>): MessageShape<Desc>;
/**
 * Merge two or more Headers objects by appending all fields from
 * all inputs to a new Headers object.
 */
export declare function appendHeaders(...headers: Headers[]): Headers;
