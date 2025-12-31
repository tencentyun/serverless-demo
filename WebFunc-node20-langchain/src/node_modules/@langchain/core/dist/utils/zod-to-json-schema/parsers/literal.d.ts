import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/literal.d.ts
type JsonSchema7LiteralType = {
  type: "string" | "number" | "integer" | "boolean";
  const: string | number | boolean;
} | {
  type: "object" | "array";
};
//#endregion
export { JsonSchema7LiteralType };
//# sourceMappingURL=literal.d.ts.map