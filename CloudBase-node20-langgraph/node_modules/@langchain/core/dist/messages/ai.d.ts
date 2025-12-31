import { ContentBlock } from "./content/index.js";
import { BaseMessage, BaseMessageChunk, BaseMessageFields } from "./base.js";
import { InvalidToolCall, ToolCall, ToolCallChunk } from "./tool.js";
import { $InferMessageContent, $InferMessageProperty, MessageStructure } from "./message.js";

//#region src/messages/ai.d.ts
interface AIMessageFields<TStructure extends MessageStructure = MessageStructure> extends BaseMessageFields<TStructure, "ai"> {
  tool_calls?: ToolCall[];
  invalid_tool_calls?: InvalidToolCall[];
  usage_metadata?: $InferMessageProperty<TStructure, "ai", "usage_metadata">;
}
declare class AIMessage<TStructure extends MessageStructure = MessageStructure> extends BaseMessage<TStructure, "ai"> implements AIMessageFields<TStructure> {
  readonly type: "ai";
  tool_calls?: ToolCall[];
  invalid_tool_calls?: InvalidToolCall[];
  usage_metadata?: AIMessageFields<TStructure>["usage_metadata"];
  get lc_aliases(): Record<string, string>;
  constructor(fields: $InferMessageContent<TStructure, "ai"> | AIMessageFields<TStructure>);
  static lc_name(): string;
  get contentBlocks(): Array<ContentBlock.Standard>;
  get _printableFields(): Record<string, unknown>;
  static isInstance(obj: unknown): obj is AIMessage;
}
/**
 * @deprecated Use {@link AIMessage.isInstance} instead
 */
declare function isAIMessage<TStructure extends MessageStructure>(x: BaseMessage): x is AIMessage<TStructure>;
/**
 * @deprecated Use {@link AIMessageChunk.isInstance} instead
 */
declare function isAIMessageChunk<TStructure extends MessageStructure>(x: BaseMessageChunk): x is AIMessageChunk<TStructure>;
type AIMessageChunkFields<TStructure extends MessageStructure = MessageStructure> = AIMessageFields<TStructure> & {
  tool_call_chunks?: ToolCallChunk[];
};
/**
 * Represents a chunk of an AI message, which can be concatenated with
 * other AI message chunks.
 */
declare class AIMessageChunk<TStructure extends MessageStructure = MessageStructure> extends BaseMessageChunk<TStructure, "ai"> implements AIMessage<TStructure>, AIMessageChunkFields<TStructure> {
  readonly type: "ai";
  tool_calls?: ToolCall[];
  invalid_tool_calls?: InvalidToolCall[];
  tool_call_chunks?: ToolCallChunk[];
  usage_metadata?: AIMessageChunkFields<TStructure>["usage_metadata"];
  constructor(fields: $InferMessageContent<TStructure, "ai"> | AIMessageChunkFields<TStructure>);
  get lc_aliases(): Record<string, string>;
  static lc_name(): string;
  get contentBlocks(): Array<ContentBlock.Standard>;
  get _printableFields(): Record<string, unknown>;
  concat(chunk: AIMessageChunk<TStructure>): this;
  static isInstance(obj: unknown): obj is AIMessageChunk;
}
//#endregion
export { AIMessage, AIMessageChunk, AIMessageChunkFields, AIMessageFields, isAIMessage, isAIMessageChunk };
//# sourceMappingURL=ai.d.ts.map