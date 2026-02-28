"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/constants/index.ts
var constants_exports = {};
__export(constants_exports, {
  COPILOT_CLOUD_API_URL: () => COPILOT_CLOUD_API_URL,
  COPILOT_CLOUD_CHAT_URL: () => COPILOT_CLOUD_CHAT_URL,
  COPILOT_CLOUD_PUBLIC_API_KEY_HEADER: () => COPILOT_CLOUD_PUBLIC_API_KEY_HEADER,
  COPILOT_CLOUD_VERSION: () => COPILOT_CLOUD_VERSION
});
module.exports = __toCommonJS(constants_exports);
var COPILOT_CLOUD_API_URL = "https://api.cloud.copilotkit.ai";
var COPILOT_CLOUD_VERSION = "v1";
var COPILOT_CLOUD_CHAT_URL = `${COPILOT_CLOUD_API_URL}/copilotkit/${COPILOT_CLOUD_VERSION}`;
var COPILOT_CLOUD_PUBLIC_API_KEY_HEADER = "X-CopilotCloud-Public-Api-Key";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  COPILOT_CLOUD_API_URL,
  COPILOT_CLOUD_CHAT_URL,
  COPILOT_CLOUD_PUBLIC_API_KEY_HEADER,
  COPILOT_CLOUD_VERSION
});
//# sourceMappingURL=index.js.map