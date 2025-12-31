"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentStateAnnotation = void 0;
exports.createAgent = createAgent;
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const langgraph_1 = require("@langchain/langgraph");
const agent_adapter_langgraph_1 = require("@cloudbase/agent-adapter-langgraph");
exports.AgentStateAnnotation = langgraph_1.Annotation.Root({
    ...agent_adapter_langgraph_1.ClientStateAnnotation.spec,
});
async function chatNode(state, config) {
    const model = new openai_1.ChatOpenAI({
        model: process.env.OPENAI_MODEL,
        apiKey: process.env.OPENAI_API_KEY,
        configuration: {
            baseURL: process.env.OPENAI_BASE_URL,
        },
    });
    if (!config) {
        config = { recursionLimit: 25 };
    }
    const modelWithTools = model.bindTools([...(state.client?.tools || [])], {
        parallel_tool_calls: false,
    });
    const systemMessage = new messages_1.SystemMessage({
        content: "你是一位精通云开发 CloudBase 的专家，擅长回答任何相关的问题。",
    });
    const response = await modelWithTools.invoke([systemMessage, ...state.messages], config);
    return new langgraph_1.Command({
        goto: langgraph_1.END,
        update: {
            messages: [response],
        },
    });
}
const workflow = new langgraph_1.StateGraph(agent_adapter_langgraph_1.ClientStateAnnotation)
    .addNode("chat_node", chatNode)
    .addEdge(langgraph_1.START, "chat_node")
    .addEdge("chat_node", langgraph_1.END);
const agenticChatGraph = workflow.compile({
    checkpointer: new langgraph_1.MemorySaver(),
});
function createAgent() {
    return {
        agent: new agent_adapter_langgraph_1.LanggraphAgent({ compiledWorkflow: agenticChatGraph }),
    };
}
//# sourceMappingURL=agent.js.map