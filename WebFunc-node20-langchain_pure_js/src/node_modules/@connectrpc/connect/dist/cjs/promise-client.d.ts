import type { DescMessage, DescService, MessageInitShape, MessageShape, DescMethodBiDiStreaming, DescMethodClientStreaming, DescMethodServerStreaming, DescMethodUnary } from "@bufbuild/protobuf";
import type { Transport } from "./transport.js";
import type { CallOptions } from "./call-options.js";
/**
 * Client is a simple client that supports unary and server-streaming
 * methods. Methods will produce a promise for the response message,
 * or an asynchronous iterable of response messages.
 */
export type Client<Desc extends DescService> = {
    [P in keyof Desc["method"]]: Desc["method"][P] extends DescMethodUnary<infer I, infer O> ? (request: MessageInitShape<I>, options?: CallOptions) => Promise<MessageShape<O>> : Desc["method"][P] extends DescMethodServerStreaming<infer I, infer O> ? (request: MessageInitShape<I>, options?: CallOptions) => AsyncIterable<MessageShape<O>> : Desc["method"][P] extends DescMethodClientStreaming<infer I, infer O> ? (request: AsyncIterable<MessageInitShape<I>>, options?: CallOptions) => Promise<MessageShape<O>> : Desc["method"][P] extends DescMethodBiDiStreaming<infer I, infer O> ? (request: AsyncIterable<MessageInitShape<I>>, options?: CallOptions) => AsyncIterable<MessageShape<O>> : never;
};
/**
 * Create a Client for the given service, invoking RPCs through the
 * given transport.
 */
export declare function createClient<T extends DescService>(service: T, transport: Transport): Client<T>;
/**
 * UnaryFn is the method signature for a unary method of a PromiseClient.
 */
type UnaryFn<I extends DescMessage, O extends DescMessage> = (request: MessageInitShape<I>, options?: CallOptions) => Promise<MessageShape<O>>;
export declare function createUnaryFn<I extends DescMessage, O extends DescMessage>(transport: Transport, method: DescMethodUnary<I, O>): UnaryFn<I, O>;
/**
 * ServerStreamingFn is the method signature for a server-streaming method of
 * a PromiseClient.
 */
type ServerStreamingFn<I extends DescMessage, O extends DescMessage> = (request: MessageInitShape<I>, options?: CallOptions) => AsyncIterable<MessageShape<O>>;
export declare function createServerStreamingFn<I extends DescMessage, O extends DescMessage>(transport: Transport, method: DescMethodServerStreaming<I, O>): ServerStreamingFn<I, O>;
/**
 * ClientStreamFn is the method signature for a client streaming method of a
 * PromiseClient.
 */
type ClientStreamingFn<I extends DescMessage, O extends DescMessage> = (request: AsyncIterable<MessageInitShape<I>>, options?: CallOptions) => Promise<MessageShape<O>>;
export declare function createClientStreamingFn<I extends DescMessage, O extends DescMessage>(transport: Transport, method: DescMethodClientStreaming<I, O>): ClientStreamingFn<I, O>;
/**
 * BiDiStreamFn is the method signature for a bi-directional streaming method
 * of a PromiseClient.
 */
type BiDiStreamingFn<I extends DescMessage, O extends DescMessage> = (request: AsyncIterable<MessageInitShape<I>>, options?: CallOptions) => AsyncIterable<MessageShape<O>>;
export declare function createBiDiStreamingFn<I extends DescMessage, O extends DescMessage>(transport: Transport, method: DescMethodBiDiStreaming<I, O>): BiDiStreamingFn<I, O>;
export {};
