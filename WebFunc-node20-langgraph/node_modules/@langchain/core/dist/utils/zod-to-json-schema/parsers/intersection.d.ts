import { JsonSchema7Type } from "../parseTypes.js";
import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/intersection.d.ts
type JsonSchema7AllOfType = {
  allOf: JsonSchema7Type[];
  unevaluatedProperties?: boolean;
};
//#endregion
export { JsonSchema7AllOfType };
//# sourceMappingURL=intersection.d.ts.map