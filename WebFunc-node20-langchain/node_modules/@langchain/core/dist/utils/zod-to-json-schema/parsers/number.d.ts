import { ErrorMessages } from "../errorMessages.js";
import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/number.d.ts
type JsonSchema7NumberType = {
  type: "number" | "integer";
  minimum?: number;
  exclusiveMinimum?: number;
  maximum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  errorMessage?: ErrorMessages<JsonSchema7NumberType>;
};
//#endregion
export { JsonSchema7NumberType };
//# sourceMappingURL=number.d.ts.map