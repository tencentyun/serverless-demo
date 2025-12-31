import { ResponseFormatUndefined } from "./responses.cjs";
import { InvokeConfiguration, StreamConfiguration } from "./runtime.cjs";
import { AgentMiddleware, AnyAnnotationRoot, InferContextInput, InferMiddlewareContextInputs, InferMiddlewareInputStates, InferMiddlewareStates, InferSchemaInput, ToAnnotationRoot } from "./middleware/types.cjs";
import { BuiltInState, CreateAgentParams, UserInput } from "./types.cjs";
import { Runnable, RunnableConfig } from "@langchain/core/runnables";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { StreamEvent } from "@langchain/core/tracers/log_stream";
import { InteropZodObject } from "@langchain/core/utils/types";
import { Command, CompiledStateGraph, GetStateOptions, LangGraphRunnableConfig, StateGraph, StreamMode, StreamOutputMap } from "@langchain/langgraph";
import { CheckpointListOptions } from "@langchain/langgraph-checkpoint";

//#region src/agents/ReactAgent.d.ts
type MergedAgentState<StateSchema extends AnyAnnotationRoot | InteropZodObject | undefined, StructuredResponseFormat extends Record<string, any> | ResponseFormatUndefined, TMiddleware extends readonly AgentMiddleware[]> = InferSchemaInput<StateSchema> & (StructuredResponseFormat extends ResponseFormatUndefined ? Omit<BuiltInState, "jumpTo"> : Omit<BuiltInState, "jumpTo"> & {
  structuredResponse: StructuredResponseFormat;
}) & InferMiddlewareStates<TMiddleware>;
type InvokeStateParameter<StateSchema extends AnyAnnotationRoot | InteropZodObject | undefined, TMiddleware extends readonly AgentMiddleware[]> = (UserInput<StateSchema> & InferMiddlewareInputStates<TMiddleware>) | Command<any, any, any> | null;
type AgentGraph<StateSchema extends AnyAnnotationRoot | InteropZodObject | undefined = undefined, StructuredResponseFormat extends Record<string, any> | ResponseFormatUndefined = Record<string, any>, ContextSchema extends AnyAnnotationRoot | InteropZodObject = AnyAnnotationRoot, TMiddleware extends readonly AgentMiddleware[] = []> = CompiledStateGraph<any, any, any, any, MergedAgentState<StateSchema, StructuredResponseFormat, TMiddleware>, ToAnnotationRoot<ContextSchema>["spec"], unknown>;
declare class ReactAgent<StructuredResponseFormat extends Record<string, any> | ResponseFormatUndefined = Record<string, any>, StateSchema extends AnyAnnotationRoot | InteropZodObject | undefined = undefined, ContextSchema extends AnyAnnotationRoot | InteropZodObject = AnyAnnotationRoot, TMiddleware extends readonly AgentMiddleware[] = readonly AgentMiddleware[]> {
  #private;
  options: CreateAgentParams<StructuredResponseFormat, StateSchema, ContextSchema>;
  constructor(options: CreateAgentParams<StructuredResponseFormat, StateSchema, ContextSchema>);
  /**
   * Get the compiled {@link https://docs.langchain.com/oss/javascript/langgraph/use-graph-api | StateGraph}.
   */
  get graph(): AgentGraph<StateSchema, StructuredResponseFormat, ContextSchema, TMiddleware>;
  /**
   * Executes the agent with the given state and returns the final state after all processing.
   *
   * This method runs the agent's entire workflow synchronously, including:
   * - Processing the input messages through any configured middleware
   * - Calling the language model to generate responses
   * - Executing any tool calls made by the model
   * - Running all middleware hooks (beforeModel, afterModel, etc.)
   *
   * @param state - The initial state for the agent execution. Can be:
   *   - An object containing `messages` array and any middleware-specific state properties
   *   - A Command object for more advanced control flow
   *
   * @param config - Optional runtime configuration including:
   * @param config.context - The context for the agent execution.
   * @param config.configurable - LangGraph configuration options like `thread_id`, `run_id`, etc.
   * @param config.store - The store for the agent execution for persisting state, see more in {@link https://docs.langchain.com/oss/javascript/langgraph/memory#memory-storage | Memory storage}.
   * @param config.signal - An optional {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | `AbortSignal`} for the agent execution.
   * @param config.recursionLimit - The recursion limit for the agent execution.
   *
   * @returns A Promise that resolves to the final agent state after execution completes.
   *          The returned state includes:
   *          - a `messages` property containing an array with all messages (input, AI responses, tool calls/results)
   *          - a `structuredResponse` property containing the structured response (if configured)
   *          - all state values defined in the middleware
   *
   * @example
   * ```typescript
   * const agent = new ReactAgent({
   *   llm: myModel,
   *   tools: [calculator, webSearch],
   *   responseFormat: z.object({
   *     weather: z.string(),
   *   }),
   * });
   *
   * const result = await agent.invoke({
   *   messages: [{ role: "human", content: "What's the weather in Paris?" }]
   * });
   *
   * console.log(result.structuredResponse.weather); // outputs: "It's sunny and 75°F."
   * ```
   */
  invoke(state: InvokeStateParameter<StateSchema, TMiddleware>, config?: InvokeConfiguration<InferContextInput<ContextSchema> & InferMiddlewareContextInputs<TMiddleware>>): Promise<MergedAgentState<StateSchema, StructuredResponseFormat, TMiddleware>>;
  /**
   * Executes the agent with streaming, returning an async iterable of state updates as they occur.
   *
   * This method runs the agent's workflow similar to `invoke`, but instead of waiting for
   * completion, it streams high-level state updates in real-time. This allows you to:
   * - Display intermediate results to users as they're generated
   * - Monitor the agent's progress through each step
   * - React to state changes as nodes complete
   *
   * For more granular event-level streaming (like individual LLM tokens), use `streamEvents` instead.
   *
   * @param state - The initial state for the agent execution. Can be:
   *   - An object containing `messages` array and any middleware-specific state properties
   *   - A Command object for more advanced control flow
   *
   * @param config - Optional runtime configuration including:
   * @param config.context - The context for the agent execution.
   * @param config.configurable - LangGraph configuration options like `thread_id`, `run_id`, etc.
   * @param config.store - The store for the agent execution for persisting state, see more in {@link https://docs.langchain.com/oss/javascript/langgraph/memory#memory-storage | Memory storage}.
   * @param config.signal - An optional {@link https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal | `AbortSignal`} for the agent execution.
   * @param config.streamMode - The streaming mode for the agent execution, see more in {@link https://docs.langchain.com/oss/javascript/langgraph/streaming#supported-stream-modes | Supported stream modes}.
   * @param config.recursionLimit - The recursion limit for the agent execution.
   *
   * @returns A Promise that resolves to an IterableReadableStream of state updates.
   *          Each update contains the current state after a node completes.
   *
   * @example
   * ```typescript
   * const agent = new ReactAgent({
   *   llm: myModel,
   *   tools: [calculator, webSearch]
   * });
   *
   * const stream = await agent.stream({
   *   messages: [{ role: "human", content: "What's 2+2 and the weather in NYC?" }]
   * });
   *
   * for await (const chunk of stream) {
   *   console.log(chunk); // State update from each node
   * }
   * ```
   */
  stream<TStreamMode extends StreamMode | StreamMode[] | undefined, TEncoding extends "text/event-stream" | undefined>(state: InvokeStateParameter<StateSchema, TMiddleware>, config?: StreamConfiguration<InferContextInput<ContextSchema> & InferMiddlewareContextInputs<TMiddleware>, TStreamMode, TEncoding>): Promise<IterableReadableStream<StreamOutputMap<TStreamMode, false, MergedAgentState<StateSchema, StructuredResponseFormat, TMiddleware>, MergedAgentState<StateSchema, StructuredResponseFormat, TMiddleware>, string, unknown, unknown, TEncoding>>>;
  /**
   * Visualize the graph as a PNG image.
   * @param params - Parameters for the drawMermaidPng method.
   * @param params.withStyles - Whether to include styles in the graph.
   * @param params.curveStyle - The style of the graph's curves.
   * @param params.nodeColors - The colors of the graph's nodes.
   * @param params.wrapLabelNWords - The maximum number of words to wrap in a node's label.
   * @param params.backgroundColor - The background color of the graph.
   * @returns PNG image as a buffer
   */
  drawMermaidPng(params?: {
    withStyles?: boolean;
    curveStyle?: string;
    nodeColors?: Record<string, string>;
    wrapLabelNWords?: number;
    backgroundColor?: string;
  }): Promise<Uint8Array<ArrayBuffer>>;
  /**
   * Draw the graph as a Mermaid string.
   * @param params - Parameters for the drawMermaid method.
   * @param params.withStyles - Whether to include styles in the graph.
   * @param params.curveStyle - The style of the graph's curves.
   * @param params.nodeColors - The colors of the graph's nodes.
   * @param params.wrapLabelNWords - The maximum number of words to wrap in a node's label.
   * @param params.backgroundColor - The background color of the graph.
   * @returns Mermaid string
   */
  drawMermaid(params?: {
    withStyles?: boolean;
    curveStyle?: string;
    nodeColors?: Record<string, string>;
    wrapLabelNWords?: number;
    backgroundColor?: string;
  }): Promise<string>;
  /**
   * The following are internal methods to enable support for LangGraph Platform.
   * They are not part of the createAgent public API.
   *
   * Note: we intentionally return as `never` to avoid type errors due to type inference.
   */
  /**
   * @internal
   */
  streamEvents(state: InvokeStateParameter<StateSchema, TMiddleware>, config?: StreamConfiguration<InferContextInput<ContextSchema> & InferMiddlewareContextInputs<TMiddleware>, StreamMode | StreamMode[] | undefined, "text/event-stream" | undefined> & {
    version?: "v1" | "v2";
  }, streamOptions?: Parameters<Runnable["streamEvents"]>[2]): IterableReadableStream<StreamEvent>;
  /**
   * @internal
   */
  getGraphAsync(config?: RunnableConfig): never;
  /**
   * @internal
   */
  getState(config: RunnableConfig, options?: GetStateOptions): never;
  /**
   * @internal
   */
  getStateHistory(config: RunnableConfig, options?: CheckpointListOptions): never;
  /**
   * @internal
   */
  getSubgraphs(namespace?: string, recurse?: boolean): never;
  /**
   * @internal
   */
  getSubgraphAsync(namespace?: string, recurse?: boolean): never;
  /**
   * @internal
   */
  updateState(inputConfig: LangGraphRunnableConfig, values: Record<string, unknown> | unknown, asNode?: string): never;
  /**
   * @internal
   */
  get builder(): StateGraph<unknown, any, any, any, any, MergedAgentState<StateSchema, StructuredResponseFormat, TMiddleware>, ToAnnotationRoot<ContextSchema>["spec"], unknown, unknown, unknown>;
}
//#endregion
export { ReactAgent };
//# sourceMappingURL=ReactAgent.d.cts.map