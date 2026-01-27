import * as z from "zod/v3";
import { EmbeddingDtype } from "./embeddingdtype.js";
import { EncodingFormat } from "./encodingformat.js";
/**
 * The text content to be embedded, can be a string or an array of strings for fast processing in bulk.
 */
export type EmbeddingRequestInputs = string | Array<string>;
export type EmbeddingRequest = {
    /**
     * The ID of the model to be used for embedding.
     */
    model: string;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * The text content to be embedded, can be a string or an array of strings for fast processing in bulk.
     */
    inputs: string | Array<string>;
    /**
     * The dimension of the output embeddings when feature available. If not provided, a default output dimension will be used.
     */
    outputDimension?: number | null | undefined;
    outputDtype?: EmbeddingDtype | undefined;
    encodingFormat?: EncodingFormat | undefined;
};
/** @internal */
export type EmbeddingRequestInputs$Outbound = string | Array<string>;
/** @internal */
export declare const EmbeddingRequestInputs$outboundSchema: z.ZodType<EmbeddingRequestInputs$Outbound, z.ZodTypeDef, EmbeddingRequestInputs>;
export declare function embeddingRequestInputsToJSON(embeddingRequestInputs: EmbeddingRequestInputs): string;
/** @internal */
export type EmbeddingRequest$Outbound = {
    model: string;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    input: string | Array<string>;
    output_dimension?: number | null | undefined;
    output_dtype?: string | undefined;
    encoding_format?: string | undefined;
};
/** @internal */
export declare const EmbeddingRequest$outboundSchema: z.ZodType<EmbeddingRequest$Outbound, z.ZodTypeDef, EmbeddingRequest>;
export declare function embeddingRequestToJSON(embeddingRequest: EmbeddingRequest): string;
//# sourceMappingURL=embeddingrequest.d.ts.map