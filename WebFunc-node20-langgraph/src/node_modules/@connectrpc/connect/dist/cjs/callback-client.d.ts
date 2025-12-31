import type { DescService, MessageInitShape, MessageShape, DescMethodServerStreaming, DescMethodUnary } from "@bufbuild/protobuf";
import { ConnectError } from "./connect-error.js";
import type { Transport } from "./transport.js";
import type { CallOptions } from "./call-options.js";
/**
 * CallbackClient is a simple client that supports unary and server
 * streaming methods. Methods take callback functions, which will be
 * called when a response message arrives, or an error occurs.
 *
 * Client methods return a function that cancels the call. This is a
 * convenient alternative to creating a AbortController and passing
 * its AbortSignal as an option to the method.
 *
 * If a call is cancelled by an AbortController or by the returned
 * cancel-function, ConnectErrors with the code Canceled are
 * silently discarded.
 *
 * CallbackClient is most convenient for use in React effects, where
 * a function returned by the effect is called when the effect is
 * torn down.
 */
export type CallbackClient<Desc extends DescService> = {
    [P in keyof Desc["method"]]: Desc["method"][P] extends DescMethodUnary<infer I, infer O> ? (request: MessageInitShape<I>, callback: (error: ConnectError | undefined, response: MessageShape<O>) => void, options?: CallOptions) => CancelFn : Desc["method"][P] extends DescMethodServerStreaming<infer I, infer O> ? (request: MessageInitShape<I>, messageCallback: (response: MessageShape<O>) => void, closeCallback: (error: ConnectError | undefined) => void, options?: CallOptions) => CancelFn : never;
};
type CancelFn = () => void;
/**
 * Create a CallbackClient for the given service, invoking RPCs through the
 * given transport.
 */
export declare function createCallbackClient<T extends DescService>(service: T, transport: Transport): CallbackClient<T>;
export {};
