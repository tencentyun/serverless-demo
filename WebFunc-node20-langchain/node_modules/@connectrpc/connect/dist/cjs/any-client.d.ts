import type { DescService, DescMethodUnary, DescMethodStreaming } from "@bufbuild/protobuf";
/**
 * AnyClient is an arbitrary service client with any method signature.
 *
 * It usually has methods for all methods defined for a service, but may
 * omit some, for example because it's transport does not support streaming.
 */
export type AnyClient = Record<string, AnyClientMethod>;
type AnyClientMethod = (...args: any[]) => any;
type CreateAnyClientMethod = (method: DescMethodUnary | DescMethodStreaming) => AnyClientMethod | null;
/**
 * Create any client for the given service.
 *
 * The given createMethod function is called for each method definition
 * of the service. The function it returns is added to the client object
 * as a method.
 */
export declare function makeAnyClient(service: DescService, createMethod: CreateAnyClientMethod): AnyClient;
export {};
