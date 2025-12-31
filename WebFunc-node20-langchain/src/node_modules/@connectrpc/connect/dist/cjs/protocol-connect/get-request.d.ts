import type { DescMessage } from "@bufbuild/protobuf";
import type { UnaryRequest } from "../interceptor.js";
/**
 * @private Internal code, does not follow semantic versioning.
 */
export declare function transformConnectPostToGetRequest<I extends DescMessage = DescMessage, O extends DescMessage = DescMessage>(request: UnaryRequest<I, O>, message: Uint8Array, useBase64: boolean): UnaryRequest<I, O>;
