import * as z from "zod/v3";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ContentChunk } from "./contentchunk.js";
import { ToolCall } from "./toolcall.js";
export type Content = string | Array<ContentChunk>;
export type DeltaMessage = {
    role?: string | null | undefined;
    content?: string | Array<ContentChunk> | null | undefined;
    toolCalls?: Array<ToolCall> | null | undefined;
};
/** @internal */
export declare const Content$inboundSchema: z.ZodType<Content, z.ZodTypeDef, unknown>;
export declare function contentFromJSON(jsonString: string): SafeParseResult<Content, SDKValidationError>;
/** @internal */
export declare const DeltaMessage$inboundSchema: z.ZodType<DeltaMessage, z.ZodTypeDef, unknown>;
export declare function deltaMessageFromJSON(jsonString: string): SafeParseResult<DeltaMessage, SDKValidationError>;
//# sourceMappingURL=deltamessage.d.ts.map