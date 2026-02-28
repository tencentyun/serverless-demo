import { AIMessageChunk } from "../messages/ai.cjs";

//#region src/errors/index.d.ts
type LangChainErrorCodes = "INVALID_PROMPT_INPUT" | "INVALID_TOOL_RESULTS" | "MESSAGE_COERCION_FAILURE" | "MODEL_AUTHENTICATION" | "MODEL_NOT_FOUND" | "MODEL_RATE_LIMIT" | "OUTPUT_PARSING_FAILURE" | "MODEL_ABORTED";
declare function addLangChainErrorFields(error: any, lc_error_code: LangChainErrorCodes): any;
/**
 * Error thrown when a model invocation is aborted via an AbortSignal.
 * Contains any partial output that was generated before the abort.
 */
declare class ModelAbortError extends Error {
  readonly name = "ModelAbortError";
  readonly lc_error_code = "MODEL_ABORTED";
  /**
   * The partial message output that was accumulated before the abort.
   * This allows callers to access whatever content was generated
   * before the operation was cancelled.
   */
  readonly partialOutput?: AIMessageChunk;
  constructor(message: string, partialOutput?: AIMessageChunk);
  /**
   * Type guard to check if an error is a ModelAbortError
   */
  static isInstance(error: unknown): error is ModelAbortError;
}
//#endregion
export { LangChainErrorCodes, ModelAbortError, addLangChainErrorFields };
//# sourceMappingURL=index.d.cts.map