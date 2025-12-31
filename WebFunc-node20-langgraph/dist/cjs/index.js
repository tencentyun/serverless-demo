"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_server_1 = require("@cloudbase/agent-server");
const dotenvx_1 = __importDefault(require("@dotenvx/dotenvx"));
const express_1 = __importDefault(require("express"));
const agent_js_1 = require("./agent.js");
const utils_js_1 = require("./utils.js");
dotenvx_1.default.config();
const app = (0, express_1.default)();
app.use(utils_js_1.checkOpenAIEnvMiddleware);
(0, agent_server_1.createExpressRoutes)({
    createAgent: agent_js_1.createAgent,
    express: app,
});
app.listen(9000, () => console.log("Listening on 9000!"));
//# sourceMappingURL=index.js.map