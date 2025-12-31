import "./record.js";
import { JsonSchema7Type } from "../parseTypes.js";
import "../Refs.js";
import "zod/v3";

//#region src/utils/zod-to-json-schema/parsers/map.d.ts
type JsonSchema7MapType = {
  type: "array";
  maxItems: 125;
  items: {
    type: "array";
    items: [JsonSchema7Type, JsonSchema7Type];
    minItems: 2;
    maxItems: 2;
  };
};
//#endregion
export { JsonSchema7MapType };
//# sourceMappingURL=map.d.ts.map