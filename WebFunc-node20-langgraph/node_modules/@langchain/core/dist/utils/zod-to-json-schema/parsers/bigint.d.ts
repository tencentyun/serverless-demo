import { ErrorMessages } from "../errorMessages.js";
import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/bigint.d.ts
type JsonSchema7BigintType = {
  type: "integer";
  format: "int64";
  minimum?: BigInt;
  exclusiveMinimum?: BigInt;
  maximum?: BigInt;
  exclusiveMaximum?: BigInt;
  multipleOf?: BigInt;
  errorMessage?: ErrorMessages<JsonSchema7BigintType>;
};
//#endregion
export { JsonSchema7BigintType };
//# sourceMappingURL=bigint.d.ts.map