import { ErrorMessages } from "../errorMessages.js";
import { JsonSchema7Type } from "../parseTypes.js";
import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/set.d.ts
type JsonSchema7SetType = {
  type: "array";
  uniqueItems: true;
  items?: JsonSchema7Type;
  minItems?: number;
  maxItems?: number;
  errorMessage?: ErrorMessages<JsonSchema7SetType>;
};
//#endregion
export { JsonSchema7SetType };
//# sourceMappingURL=set.d.ts.map