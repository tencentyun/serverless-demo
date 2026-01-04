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

// src/utils/conditions.ts
var conditions_exports = {};
__export(conditions_exports, {
  executeConditions: () => executeConditions
});
module.exports = __toCommonJS(conditions_exports);
function executeConditions({
  conditions,
  value
}) {
  if (!(conditions == null ? void 0 : conditions.length))
    return true;
  return conditions.every((condition) => executeCondition(condition, value));
}
function executeCondition(condition, value) {
  const targetValue = condition.path ? getValueFromPath(value, condition.path) : value;
  switch (condition.rule) {
    case "AND":
      return condition.conditions.every((c) => executeCondition(c, value));
    case "OR":
      return condition.conditions.some((c) => executeCondition(c, value));
    case "NOT":
      return !condition.conditions.every((c) => executeCondition(c, value));
    case "EQUALS":
      return targetValue === condition.value;
    case "NOT_EQUALS":
      return targetValue !== condition.value;
    case "GREATER_THAN":
      return targetValue > condition.value;
    case "LESS_THAN":
      return targetValue < condition.value;
    case "CONTAINS":
      return Array.isArray(targetValue) && targetValue.includes(condition.value);
    case "NOT_CONTAINS":
      return Array.isArray(targetValue) && !targetValue.includes(condition.value);
    case "MATCHES":
      return new RegExp(condition.value).test(String(targetValue));
    case "STARTS_WITH":
      return String(targetValue).startsWith(condition.value);
    case "ENDS_WITH":
      return String(targetValue).endsWith(condition.value);
    case "EXISTS":
      return targetValue !== void 0 && targetValue !== null;
    case "NOT_EXISTS":
      return targetValue === void 0 || targetValue === null;
  }
}
function getValueFromPath(obj, path) {
  return path.split(".").reduce((acc, part) => acc == null ? void 0 : acc[part], obj);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  executeConditions
});
//# sourceMappingURL=conditions.js.map