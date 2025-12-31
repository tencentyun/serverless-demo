import { BaseMessage } from "@langchain/core/messages";

//#region src/agents/middleware/utils.d.ts

/**
 * Default token counter that approximates based on character count
 * @param messages Messages to count tokens for
 * @returns Approximate token count
 */
declare function countTokensApproximately(messages: BaseMessage[]): number;
//#endregion
export { countTokensApproximately };
//# sourceMappingURL=utils.d.cts.map