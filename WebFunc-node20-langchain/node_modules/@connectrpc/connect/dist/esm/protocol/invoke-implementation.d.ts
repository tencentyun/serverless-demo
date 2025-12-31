import type { DescMessage, MessageShape } from "@bufbuild/protobuf";
import type { HandlerContext, MethodImplSpec } from "../implementation.js";
import type { AsyncIterableTransform } from "./async-iterable.js";
import type { Interceptor } from "../interceptor.js";
/**
 * Invoke a user-provided implementation of a unary RPC. Returns a normalized
 * output message.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function invokeUnaryImplementation<I extends DescMessage, O extends DescMessage>(spec: MethodImplSpec<I, O> & {
    kind: "unary";
}, context: HandlerContext, input: MessageShape<I>, interceptors: Interceptor[]): Promise<MessageShape<O>>;
/**
 * Return an AsyncIterableTransform that invokes a user-provided implementation,
 * giving it input from an asynchronous iterable, and returning its output as an
 * asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformInvokeImplementation<I extends DescMessage, O extends DescMessage>(spec: MethodImplSpec<I, O>, context: HandlerContext, interceptors: Interceptor[]): AsyncIterableTransform<MessageShape<I>, MessageShape<O>>;
