import type { ComponentPropsWithoutRef, ElementType } from "react";
import type { RemoveUIMessage, UIMessage } from "../types.js";
interface MessageLike {
    id?: string;
}
/**
 * Helper to send and persist UI messages. Accepts a map of component names to React components
 * as type argument to provide type safety. Will also write to the `options?.stateKey` state.
 *
 * @param config LangGraphRunnableConfig
 * @param options
 * @returns
 */
export declare const typedUi: <Decl extends Record<string, ElementType>>(config: {
    writer?: (chunk: unknown) => void;
    runId?: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    runName?: string;
    configurable?: {
        __pregel_send?: (writes_: [string, unknown][]) => void;
        [key: string]: unknown;
    };
}, options?: {
    /** The key to write the UI messages to. Defaults to `ui`. */
    stateKey?: string;
}) => {
    push: {
        <K extends keyof Decl & string>(message: {
            id?: string;
            name: K;
            props: { [K_1 in keyof Decl]: ComponentPropsWithoutRef<Decl[K_1]>; }[K];
            metadata?: Record<string, unknown>;
        }, options?: {
            message?: MessageLike;
            merge?: boolean;
        }): UIMessage<K, { [K_1 in keyof Decl]: ComponentPropsWithoutRef<Decl[K_1]>; }[K]>;
        <K extends keyof Decl & string>(message: {
            id?: string;
            name: K;
            props: Partial<{ [K_1 in keyof Decl]: ComponentPropsWithoutRef<Decl[K_1]>; }[K]>;
            metadata?: Record<string, unknown>;
        }, options: {
            message?: MessageLike;
            merge: true;
        }): UIMessage<K, Partial<{ [K_1 in keyof Decl]: ComponentPropsWithoutRef<Decl[K_1]>; }[K]>>;
    };
    delete: (id: string) => RemoveUIMessage;
    items: (RemoveUIMessage | UIMessage<string, Record<string, unknown>>)[];
};
export {};
