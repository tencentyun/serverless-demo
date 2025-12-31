import type { DescMessage, MessageInitShape, MessageShape } from "@bufbuild/protobuf";
/**
 *  Takes a partial protobuf messages of the
 *  specified message type as input, and returns full instances.
 */
export declare function normalize<Desc extends DescMessage>(desc: Desc, message: MessageInitShape<Desc>): MessageShape<Desc>;
/**
 * Takes an AsyncIterable of partial protobuf messages of the
 * specified message type as input, and yields full instances.
 */
export declare function normalizeIterable<Desc extends DescMessage>(desc: Desc, input: AsyncIterable<MessageInitShape<Desc>>): AsyncIterable<MessageShape<Desc>>;
