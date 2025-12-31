import { LanggraphAgent } from "@cloudbase/agent-adapter-langgraph";
export declare const AgentStateAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/core/messages").BaseMessage<import("@langchain/core/messages").MessageStructure, import("@langchain/core/messages").MessageType>[], import("@langchain/langgraph").Messages>;
    client: {
        (): import("@langchain/langgraph").LastValue<import("@langchain/langgraph").StateType<{
            tools: {
                (): import("@langchain/langgraph").LastValue<any[]>;
                (annotation: import("@langchain/langgraph").SingleReducer<any[], any[]>): import("@langchain/langgraph").BinaryOperatorAggregate<any[], any[]>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>>;
        (annotation: import("@langchain/langgraph").SingleReducer<import("@langchain/langgraph").StateType<{
            tools: {
                (): import("@langchain/langgraph").LastValue<any[]>;
                (annotation: import("@langchain/langgraph").SingleReducer<any[], any[]>): import("@langchain/langgraph").BinaryOperatorAggregate<any[], any[]>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>, import("@langchain/langgraph").StateType<{
            tools: {
                (): import("@langchain/langgraph").LastValue<any[]>;
                (annotation: import("@langchain/langgraph").SingleReducer<any[], any[]>): import("@langchain/langgraph").BinaryOperatorAggregate<any[], any[]>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>>): import("@langchain/langgraph").BinaryOperatorAggregate<import("@langchain/langgraph").StateType<{
            tools: {
                (): import("@langchain/langgraph").LastValue<any[]>;
                (annotation: import("@langchain/langgraph").SingleReducer<any[], any[]>): import("@langchain/langgraph").BinaryOperatorAggregate<any[], any[]>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>, import("@langchain/langgraph").StateType<{
            tools: {
                (): import("@langchain/langgraph").LastValue<any[]>;
                (annotation: import("@langchain/langgraph").SingleReducer<any[], any[]>): import("@langchain/langgraph").BinaryOperatorAggregate<any[], any[]>;
                Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
            };
        }>>;
        Root: <S extends import("@langchain/langgraph").StateDefinition>(sd: S) => import("@langchain/langgraph").AnnotationRoot<S>;
    };
}>;
export type AgentState = typeof AgentStateAnnotation.State;
export declare function createAgent(): {
    agent: LanggraphAgent;
};
//# sourceMappingURL=agent.d.ts.map