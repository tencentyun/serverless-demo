export declare function BytesLineDecoder(): TransformStream<Uint8Array<ArrayBufferLike>, Uint8Array<ArrayBufferLike>>;
interface StreamPart {
    id: string | undefined;
    event: string;
    data: unknown;
}
export declare function SSEDecoder(): TransformStream<Uint8Array<ArrayBufferLike>, StreamPart>;
export {};
