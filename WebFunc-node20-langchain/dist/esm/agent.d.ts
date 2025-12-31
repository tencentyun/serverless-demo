export declare function createAgent(): import("langchain").ReactAgent<import("langchain").ResponseFormatUndefined, undefined, import("langchain").AnyAnnotationRoot, readonly [import("langchain").AgentMiddleware<import("zod").ZodObject<{
    client: import("zod").ZodObject<{
        tools: import("zod").ZodArray<import("zod").ZodObject<{
            name: import("zod").ZodString;
            description: import("zod").ZodString;
            schema: import("zod").ZodAny;
        }, "strip", import("zod").ZodTypeAny, {
            name: string;
            description: string;
            schema?: any;
        }, {
            name: string;
            description: string;
            schema?: any;
        }>, "many">;
    }, "strip", import("zod").ZodTypeAny, {
        tools: {
            name: string;
            description: string;
            schema?: any;
        }[];
    }, {
        tools: {
            name: string;
            description: string;
            schema?: any;
        }[];
    }>;
}, "strip", import("zod").ZodTypeAny, {
    client: {
        tools: {
            name: string;
            description: string;
            schema?: any;
        }[];
    };
}, {
    client: {
        tools: {
            name: string;
            description: string;
            schema?: any;
        }[];
    };
}>, undefined, any>]>;
//# sourceMappingURL=agent.d.ts.map