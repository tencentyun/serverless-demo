import { ToolCall } from "@langchain/core/messages/tool";

//#region src/agents/errors.d.ts
declare class MultipleToolsBoundError extends Error {
  constructor();
}
/**
 * Raised when model returns multiple structured output tool calls when only one is expected.
 */
declare class MultipleStructuredOutputsError extends Error {
  readonly toolNames: string[];
  constructor(toolNames: string[]);
}
/**
 * Raised when structured output tool call arguments fail to parse according to the schema.
 */
declare class StructuredOutputParsingError extends Error {
  readonly toolName: string;
  readonly errors: string[];
  constructor(toolName: string, errors: string[]);
}
/**
 * Raised when a tool call is throwing an error.
 */
declare class ToolInvocationError extends Error {
  readonly toolCall: ToolCall;
  readonly toolError: Error;
  constructor(toolError: unknown, toolCall: ToolCall);
}
//#endregion
export { MultipleStructuredOutputsError, MultipleToolsBoundError, StructuredOutputParsingError, ToolInvocationError };
//# sourceMappingURL=errors.d.cts.map