import { createExpressRoutes } from "@cloudbase/agent-server";
import dotenvx from "@dotenvx/dotenvx";
import express from "express";
import { createAgent } from "./agent.js";
import { checkOpenAIEnvMiddleware } from "./utils.js";

dotenvx.config();

const app = express(); 

app.use(checkOpenAIEnvMiddleware);

createExpressRoutes({
  createAgent,
  express: app,
});

app.listen(9000, () => console.log("Listening on 9000!"));
