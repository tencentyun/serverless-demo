import * as z from "zod/v3";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ProcessingStatusOut = {
    documentId: string;
    processingStatus: string;
};
/** @internal */
export declare const ProcessingStatusOut$inboundSchema: z.ZodType<ProcessingStatusOut, z.ZodTypeDef, unknown>;
export declare function processingStatusOutFromJSON(jsonString: string): SafeParseResult<ProcessingStatusOut, SDKValidationError>;
//# sourceMappingURL=processingstatusout.d.ts.map