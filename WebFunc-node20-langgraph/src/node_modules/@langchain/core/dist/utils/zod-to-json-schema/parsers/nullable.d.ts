import { JsonSchema7NullType } from "./null.js";
import { JsonSchema7Type } from "../parseTypes.js";
import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/nullable.d.ts
type JsonSchema7NullableType = {
  anyOf: [JsonSchema7Type, JsonSchema7NullType];
} | {
  type: [string, "null"];
};
//#endregion
export { JsonSchema7NullableType };
//# sourceMappingURL=nullable.d.ts.map