import { LangchainAgent } from "@cloudbase/agent-adapter-langchain";
import { createExpressRoutes } from "@cloudbase/agent-server";
import dotenvx from "@dotenvx/dotenvx";
import express from "express";
import { createAgent as createLangchainAgent } from "./agent.js";
import { checkOpenAIEnvMiddleware } from "./utils.js";

dotenvx.config();

function createAgent() {
  const lcAgent = createLangchainAgent();

  return {
    agent: new LangchainAgent({
      agent: lcAgent,
    }),
  };
}

const app = express(); 
 
app.use(checkOpenAIEnvMiddleware);

createExpressRoutes({
  createAgent,
  express: app,
});

app.listen(9000, () => console.log("Listening on 9000!"));
