export declare function createAgent(): import("langchain").ReactAgent<import("langchain").ResponseFormatUndefined, undefined, import("langchain").AnyAnnotationRoot, readonly [import("langchain").AgentMiddleware<import("zod/v3").ZodObject<{
    client: import("zod/v3").ZodObject<{
        tools: import("zod/v3").ZodArray<import("zod/v3").ZodObject<{
            name: import("zod/v3").ZodString;
            description: import("zod/v3").ZodString;
            schema: import("zod/v3").ZodAny;
        }, "strip", import("zod/v3").ZodTypeAny, {
            name: string;
            description: string;
            schema?: any;
        }, {
            name: string;
            description: string;
            schema?: any;
        }>, "many">;
    }, "strip", import("zod/v3").ZodTypeAny, {
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
}, "strip", import("zod/v3").ZodTypeAny, {
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