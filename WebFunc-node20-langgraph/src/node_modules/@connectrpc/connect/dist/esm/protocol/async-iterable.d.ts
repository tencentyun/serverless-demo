import type { EnvelopedMessage } from "./envelope.js";
import type { Serialization } from "./serialization.js";
import type { Compression } from "./compression.js";
/**
 * A function that takes an asynchronous iterable as a source, and returns a
 * transformed asynchronous iterable.
 *
 * The following function is a simple no-op implementation that yields every
 * element from the source:
 *
 * ```ts
 * async function* t<T>(input) {
 *   yield* input;
 * }
 * ```
 *
 * The following function takes fetch responses as a source, and yields the
 * text body of each:
 *
 * ```ts
 * async function* t<T>(input: AsyncIterable<Response>): AsyncIterable<string> {
 *   for await (const r of input) {
 *     yield await r.text();
 *   }
 * }
 * ```
 *
 * Transformation functions can be passed to pipe() and pipeTo().
 *
 * @private Internal code, does not follow semantic versioning.
 */
export type AsyncIterableTransform<I, O = I> = (data: AsyncIterable<I>) => AsyncIterable<O>;
/**
 * A function that takes an asynchronous iterable as a source and consumes it
 * to the end, optionally returning a cumulative value.
 *
 * Sinks are the used with pipeTo().
 *
 * @private Internal code, does not follow semantic versioning.
 */
export type AsyncIterableSink<T, R = void> = (iterable: AsyncIterable<T>) => Promise<R>;
/**
 * Options for pipe() and pipeTo().
 *
 * @private Internal code, does not follow semantic versioning.
 */
interface PipeOptions {
    /**
     * Set to true to abort the source iterable on downstream errors.
     * The source iterable must not swallow errors raised by yield.
     *
     * Why? If iterators are chained, any error raised by the source or any
     * transform travels down the stream. But if an error happens downstream, the
     * source and transformations are left dangling:
     *
     * ```ts
     * async function source*() {
     *   const conn = await dbConn();
     *   yield await conn.query("SELECT 1"); // consumed downstream
     *   yield await conn.query("SELECT 2"); // never consumed
     *   conn.close(); // never runs
     * }
     * for await (const element of source()) {
     *   // let's say we try to write the element to disk, but the disk is full
     *   throw "err";
     * }
     * ```
     *
     * If this option is set to true, an error raised by the sink function given
     * to pipeTo() will raise the same error in the source iterable.
     *
     * ```ts
     * async function source*() {
     *   const conn = await dbConn();
     *   try {
     *     yield await conn.query("SELECT 1"); // consumed downstream
     *     yield await conn.query("SELECT 2"); // never consumed
     *   } finally {
     *     conn.close(); // runs!
     *   }
     * }
     * await pipeTo(source(), async iterable => {
     *   for await (const element of source()) {
     *     // let's say we try to write the element to disk, but the disk is full
     *     throw "err";
     *   }
     * }, { propagateDownStreamError: true });
     * ```
     *
     * If this option is set to true with pipe(), the downstream consumer of the
     * iterable returned by pipe() can abort the source iterable by calling throw()
     * on the iterator.
     */
    propagateDownStreamError?: boolean;
}
/**
 * ParsedEnvelopedMessage is the deserialized counterpart to an
 * EnvelopedMessage.
 *
 * It is either a deserialized message M, or a deserialized end-of-stream
 * message E, typically distinguished by a flag on an enveloped message.
 *
 * @private Internal code, does not follow semantic versioning.
 */
type ParsedEnvelopedMessage<M, E> = {
    end: false;
    value: M;
} | {
    end: true;
    value: E;
};
/**
 * Takes an asynchronous iterable as a source, and passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2>(iterable: AsyncIterable<T1>, sink: AsyncIterableSink<T1, T2>, options?: PipeOptions): Promise<T2>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3>(iterable: AsyncIterable<T1>, transform: AsyncIterableTransform<T1, T2>, sink: AsyncIterableSink<T2, T3>, options?: PipeOptions): Promise<T3>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, sink: AsyncIterableSink<T3, T4>, options?: PipeOptions): Promise<T4>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, sink: AsyncIterableSink<T4, T5>, options?: PipeOptions): Promise<T5>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, sink: AsyncIterableSink<T5, T6>, options?: PipeOptions): Promise<T6>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6, T7>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, sink: AsyncIterableSink<T6, T7>, options?: PipeOptions): Promise<T7>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6, T7, T8>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, sink: AsyncIterableSink<T7, T8>, options?: PipeOptions): Promise<T8>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6, T7, T8, T9>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, sink: AsyncIterableSink<T8, T9>, options?: PipeOptions): Promise<T9>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, sink: AsyncIterableSink<T9, T10>, options?: PipeOptions): Promise<T10>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, transform9: AsyncIterableTransform<T9, T10>, sink: AsyncIterableSink<T10, T11>, options?: PipeOptions): Promise<T11>;
/**
 * Takes an asynchronous iterable as a source, applies transformations, and
 * passes it to a sink.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipeTo<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, transform9: AsyncIterableTransform<T9, T10>, transform10: AsyncIterableTransform<T10, T11>, sink: AsyncIterableSink<T11, T12>, options?: PipeOptions): Promise<T12>;
/**
 * Creates an AsyncIterableSink that concatenates all elements from the input.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function sinkAll<T>(): AsyncIterableSink<T, T[]>;
/**
 * Creates an AsyncIterableSink that concatenates all chunks from the input into
 * a single Uint8Array.
 *
 * The iterable raises an error if the more than readMaxBytes are read.
 *
 * An optional length hint can be provided to optimize allocation and validation.
 * If more or less bytes are present in the source that the length hint indicates,
 * and error is raised.
 * If the length hint is larger than readMaxBytes, an error is raised.
 * If the length hint is not a positive integer, it is ignored.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function sinkAllBytes(readMaxBytes: number, lengthHint?: number | string | null): AsyncIterableSink<Uint8Array, Uint8Array>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2>(iterable: AsyncIterable<T1>, transform: AsyncIterableTransform<T1, T2>, options?: PipeOptions): AsyncIterable<T2>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, options?: PipeOptions): AsyncIterable<T3>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, options?: PipeOptions): AsyncIterable<T4>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, options?: PipeOptions): AsyncIterable<T5>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, options?: PipeOptions): AsyncIterable<T6>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6, T7>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, options?: PipeOptions): AsyncIterable<T7>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6, T7, T8>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, options?: PipeOptions): AsyncIterable<T8>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, options?: PipeOptions): AsyncIterable<T9>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, transform9: AsyncIterableTransform<T9, T10>, options?: PipeOptions): AsyncIterable<T10>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, transform9: AsyncIterableTransform<T9, T10>, transform10: AsyncIterableTransform<T10, T11>, options?: PipeOptions): AsyncIterable<T11>;
/**
 * Apply one or more transformations to an asynchronous iterable.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function pipe<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12>(iterable: AsyncIterable<T1>, transform1: AsyncIterableTransform<T1, T2>, transform2: AsyncIterableTransform<T2, T3>, transform3: AsyncIterableTransform<T3, T4>, transform4: AsyncIterableTransform<T4, T5>, transform5: AsyncIterableTransform<T5, T6>, transform6: AsyncIterableTransform<T6, T7>, transform7: AsyncIterableTransform<T7, T8>, transform8: AsyncIterableTransform<T8, T9>, transform9: AsyncIterableTransform<T9, T10>, transform10: AsyncIterableTransform<T10, T11>, transform11: AsyncIterableTransform<T11, T12>, options?: PipeOptions): AsyncIterable<T12>;
/**
 * Creates an AsyncIterableTransform that catches any error from the input, and
 * passes it to the given catchError function.
 *
 * The catchError function may return a final value.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformCatch<T>(catchError: TransformCatchErrorFn<T>): AsyncIterableTransform<T>;
type TransformCatchErrorFn<C> = ((reason: unknown) => void) | ((reason: unknown) => C | undefined) | ((reason: unknown) => Promise<C | undefined>);
/**
 * Creates an AsyncIterableTransform that catches any error from the input, and
 * passes it to the given function. Unlike transformCatch(), the given function
 * is also called when no error is raised.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformCatchFinally<T>(catchFinally: TransformCatchFinallyFn<T>): AsyncIterableTransform<T>;
/**
 * The function to always run at the end of an async iterable.
 * If an error was caught, it is passed as the `reason` argument.
 * If the iterable finished successfully, `reason` is undefined.
 */
type TransformCatchFinallyFn<C> = ((reason: unknown) => void) | ((reason: unknown) => C | undefined) | ((reason: unknown) => Promise<C | undefined>);
/**
 * Creates an AsyncIterableTransform that appends a value.
 *
 * The element to append is provided by a function. If the function returns
 * undefined, no element is appended.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformAppend<T>(provide: TransformXpendProvide<T>): AsyncIterableTransform<Awaited<T>>;
/**
 * Creates an AsyncIterableTransform that prepends an element.
 *
 * The element to prepend is provided by a function. If the function returns
 * undefined, no element is appended.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformPrepend<T>(provide: TransformXpendProvide<T>): AsyncIterableTransform<Awaited<T>>;
type TransformXpendProvide<T> = T extends undefined ? never : (() => T | undefined) | (() => Promise<T | undefined>);
/**
 * Creates an AsyncIterableTransform that reads all bytes from the input, and
 * concatenates them to a single Uint8Array.
 *
 * The iterable raises an error if the more than readMaxBytes are read.
 *
 * An optional length hint can be provided to optimize allocation and validation.
 * If more or less bytes are present in the source that the length hint indicates,
 * and error is raised.
 * If the length hint is larger than readMaxBytes, an error is raised.
 * If the length hint is not a positive integer, it is ignored.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformReadAllBytes(readMaxBytes: number, lengthHint?: number | string | null): AsyncIterableTransform<Uint8Array>;
/**
 * Creates an AsyncIterableTransform that takes a specified type as input,
 * and serializes it as an enveloped messages.
 *
 * Note that this function has an override that lets the input stream
 * distinguish between regular messages, and end-of-stream messages, as used
 * by the RPP-web and Connect protocols.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformSerializeEnvelope<T>(serialization: Serialization<T>): AsyncIterableTransform<T, EnvelopedMessage>;
/**
 * Creates an AsyncIterableTransform that takes a value or special end type, and
 * serializes it as an enveloped message.
 *
 * For example, a source with { end: true, value: ... } is serialized using
 * the given endSerialization, and the resulting enveloped message has the
 * given endStreamFlag.
 *
 * A source with { end: false, value: ... } is serialized using the given
 * serialization, and the resulting enveloped message does not have the given
 * endStreamFlag.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformSerializeEnvelope<T, E>(serialization: Serialization<T>, endStreamFlag: number, endSerialization: Serialization<E>): AsyncIterableTransform<ParsedEnvelopedMessage<T, E>, EnvelopedMessage>;
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as input,
 * parses the envelope payload and outputs the result.
 *
 * Note that this function has overrides that let the stream distinguish
 * between regular messages, and end-of-stream messages, as used by the
 * gRPP-web and Connect protocols.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformParseEnvelope<T>(serialization: Serialization<T>): AsyncIterableTransform<EnvelopedMessage, T>;
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as input,
 * parses the envelope payload and outputs the result.
 *
 * Note that this override will look for the given endStreamFlag, and silently
 * ignore envelopes with this flag.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformParseEnvelope<T>(serialization: Serialization<T>, endStreamFlag: number): AsyncIterableTransform<EnvelopedMessage, T>;
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as input,
 * parses the envelope payload and outputs the result.
 *
 * Note that this override will look for the given endStreamFlag, and raise
 * and error if it is set.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformParseEnvelope<T>(serialization: Serialization<T>, endStreamFlag: number, endSerialization: null): AsyncIterableTransform<EnvelopedMessage, T>;
/**
 * Creates an AsyncIterableTransform that takes an enveloped message as input,
 * and outputs a ParsedEnvelopedMessage.
 *
 * For example, if the given endStreamFlag is set for a source envelope, its
 * payload is parsed using the given endSerialization, and an object with
 * { end: true, value: ... } is returned.
 *
 * If the endStreamFlag is not set, the payload is parsed using the given
 * serialization, and an object with { end: false, value: ... } is returned.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformParseEnvelope<T, E>(serialization: Serialization<T>, endStreamFlag: number, endSerialization: Serialization<E>): AsyncIterableTransform<EnvelopedMessage, ParsedEnvelopedMessage<T, E>>;
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as a source,
 * and compresses them if they are larger than compressMinBytes.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformCompressEnvelope(compression: Compression | null, compressMinBytes: number): AsyncIterableTransform<EnvelopedMessage, EnvelopedMessage>;
/**
 * Creates an AsyncIterableTransform that takes enveloped messages as a source,
 * and decompresses them using the given compression.
 *
 * The iterable raises an error if the decompressed payload of an enveloped
 * message is larger than readMaxBytes, or if no compression is provided.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformDecompressEnvelope(compression: Compression | null, readMaxBytes: number): AsyncIterableTransform<EnvelopedMessage, EnvelopedMessage>;
/**
 * Create an AsyncIterableTransform that takes enveloped messages as a source,
 * and joins them into a stream of raw bytes.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformJoinEnvelopes(): AsyncIterableTransform<EnvelopedMessage, Uint8Array>;
/**
 * Create an AsyncIterableTransform that takes raw bytes as a source, and splits
 * them into enveloped messages.
 *
 * The iterable raises an error
 * - if the payload of an enveloped message is larger than readMaxBytes,
 * - if the stream ended before an enveloped message fully arrived,
 * - or if the stream ended with extraneous data.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformSplitEnvelope(readMaxBytes: number): AsyncIterableTransform<Uint8Array, EnvelopedMessage>;
/**
 * Reads all bytes from the source, and concatenates them to a single Uint8Array.
 *
 * Raises an error if:
 * - more than readMaxBytes are read
 * - lengthHint is a positive integer, but larger than readMaxBytes
 * - lengthHint is a positive integer, and the source contains more or less bytes
 *   than promised
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function readAllBytes(iterable: AsyncIterable<Uint8Array>, readMaxBytes: number, lengthHint?: number | string | null): Promise<Uint8Array>;
/**
 * Wait for the first element of an iterable without modifying the iterable.
 * This consumes the first element, but pushes it back on the stack.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function untilFirst<T>(iterable: AsyncIterable<T>): Promise<AsyncIterable<T>>;
interface Abortable {
    /**
     * Abort the iterator.
     */
    readonly abort: (reason: unknown) => Promise<AbortState>;
}
type AbortState = "rethrown" | "completed" | "caught";
/**
 * Wrap the given iterable and return an iterable with an abort() method.
 *
 * This function exists purely for convenience. Where one would typically have
 * to access the iterator directly, advance through all elements, and call
 * AsyncIterator.throw() to notify the upstream iterable, this function allows
 * to use convenient for-await loops and still notify the upstream iterable:
 *
 * ```ts
 * const abortable = makeIterableAbortable(iterable);
 * for await (const ele of abortable) {
 *   await abortable.abort("ERR");
 * }
 * ```
 * There are a couple of limitations of this function:
 * - the given async iterable must implement throw
 * - the async iterable cannot be re-use
 * - if source catches errors and yields values for them, they are ignored, and
 *   the source may still dangle
 *
 * There are four possible ways an async function* can handle yield errors:
 * 1. don't catch errors at all - Abortable.abort() will resolve "rethrown"
 * 2. catch errors and rethrow - Abortable.abort() will resolve "rethrown"
 * 3. catch errors and return - Abortable.abort() will resolve "completed"
 * 4. catch errors and yield a value - Abortable.abort() will resolve "caught"
 *
 * Note that catching errors and yielding a value is problematic, and it should
 * be documented that this may leave the source in a dangling state.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function makeIterableAbortable<T>(iterable: AsyncIterable<T>): AsyncIterable<T> & Abortable;
/**
 * WritableIterable is an AsyncIterable that can be used
 * to supply values imperatively to the consumer of the
 * AsyncIterable.
 */
export interface WritableIterable<T> extends AsyncIterable<T> {
    /**
     * Makes the payload available to the consumer of the
     * iterable.
     */
    write: (payload: T) => Promise<void>;
    /**
     * Closes the writer indicating to its consumer that no further
     * payloads will be received.
     *
     * Any writes that happen after close is called will return an error.
     */
    close: () => void;
}
/**
 * Create a new WritableIterable.
 */
export declare function createWritableIterable<T>(): WritableIterable<T>;
/**
 * Create an asynchronous iterable from an array.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function createAsyncIterable<T>(items: T[]): AsyncIterable<T>;
export {};
