"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAgent = createAgent;
const langchain_1 = require("langchain");
const langgraph_1 = require("@langchain/langgraph");
const openai_1 = require("@langchain/openai");
const agent_adapter_langchain_1 = require("@cloudbase/agent-adapter-langchain");
const checkpointer = new langgraph_1.MemorySaver();
function createAgent() {
    // Configure model
    const model = new openai_1.ChatOpenAI({
        model: process.env.OPENAI_MODEL,
        apiKey: process.env.OPENAI_API_KEY,
        configuration: {
            baseURL: process.env.OPENAI_BASE_URL,
        },
    });
    // Create agent
    return (0, langchain_1.createAgent)({
        model,
        checkpointer,
        middleware: [(0, agent_adapter_langchain_1.clientTools)()],
        systemPrompt: "你是一位精通云开发 CloudBase 的专家，擅长回答任何相关的问题。",
    });
}
//# sourceMappingURL=agent.js.map