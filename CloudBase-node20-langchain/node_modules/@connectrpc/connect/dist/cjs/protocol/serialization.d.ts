import type { MessageShape, BinaryReadOptions, BinaryWriteOptions, DescMessage, JsonReadOptions, JsonWriteOptions, DescMethodStreaming, DescMethodUnary } from "@bufbuild/protobuf";
/**
 * Serialization provides methods to serialize or parse data with a certain
 * format.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export interface Serialization<T> {
    /**
     * Serialize T. Raises a ConnectError with Code.Internal if an error occurs.
     */
    serialize: (data: T) => Uint8Array;
    /**
     * Parse T. Raises a ConnectError with Code.InvalidArgument if an error occurs.
     */
    parse: (data: Uint8Array) => T;
}
/**
 * Sets default JSON serialization options for connect-es.
 *
 * With standard protobuf JSON serialization, unknown JSON fields are
 * rejected by default. In connect-es, unknown JSON fields are ignored
 * by default.
 */
export declare function getJsonOptions(options: Partial<JsonReadOptions & JsonWriteOptions> | undefined): {
    ignoreUnknownFields?: boolean | undefined;
    registry?: import("@bufbuild/protobuf").Registry;
    alwaysEmitImplicit?: boolean | undefined;
    enumAsInteger?: boolean | undefined;
    useProtoFieldName?: boolean | undefined;
};
/**
 * Create an object that provides convenient access to request and response
 * message serialization for a given method.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createMethodSerializationLookup<I extends DescMessage, O extends DescMessage>(method: DescMethodUnary<I, O> | DescMethodStreaming<I, O>, binaryOptions: Partial<BinaryReadOptions & BinaryWriteOptions> | undefined, jsonOptions: Partial<JsonReadOptions & JsonWriteOptions> | undefined, limitOptions: {
    writeMaxBytes: number;
    readMaxBytes: number;
}): MethodSerializationLookup<I, O>;
/**
 * MethodSerializationLookup provides convenient access to request and response
 * message serialization for a given method.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export interface MethodSerializationLookup<I extends DescMessage, O extends DescMessage> {
    /**
     * Get the JSON or binary serialization for the request message type.
     */
    getI(useBinaryFormat: boolean): Serialization<MessageShape<I>>;
    /**
     * Get the JSON or binary serialization for the response message type.
     */
    getO(useBinaryFormat: boolean): Serialization<MessageShape<O>>;
}
/**
 * Returns functions to normalize and serialize the input message
 * of an RPC, and to parse the output message of an RPC.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createClientMethodSerializers<I extends DescMessage, O extends DescMessage>(method: DescMethodUnary<I, O> | DescMethodStreaming<I, O>, useBinaryFormat: boolean, jsonOptions?: JsonSerializationOptions, binaryOptions?: BinarySerializationOptions): {
    parse: (data: Uint8Array) => MessageShape<O>;
    serialize: (data: MessageShape<I>) => Uint8Array;
};
/**
 * Apply I/O limits to a Serialization object, returning a new object.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function limitSerialization<T>(serialization: Serialization<T>, limitOptions: {
    writeMaxBytes: number;
    readMaxBytes: number;
}): Serialization<T>;
/**
 * Options for createBinarySerialization()
 */
type BinarySerializationOptions = Partial<BinaryReadOptions & BinaryWriteOptions>;
/**
 * Creates a Serialization object for serializing the given protobuf message
 * with the protobuf binary format.
 */
export declare function createBinarySerialization<Desc extends DescMessage>(desc: Desc, options: BinarySerializationOptions | undefined): Serialization<MessageShape<Desc>>;
/**
 * Options for createJsonSerialization()
 */
type JsonSerializationOptions = Partial<JsonReadOptions & JsonWriteOptions> & {
    textEncoder?: {
        encode(input?: string): Uint8Array;
    };
    textDecoder?: {
        decode(input?: Uint8Array): string;
    };
};
/**
 * Creates a Serialization object for serializing the given protobuf message
 * with the protobuf canonical JSON encoding.
 *
 * By default, unknown fields are ignored.
 */
export declare function createJsonSerialization<Desc extends DescMessage>(desc: Desc, options: JsonSerializationOptions | undefined): Serialization<MessageShape<Desc>>;
export {};
