import { __export } from "../_virtual/rolldown_runtime.js";
import { interopZodObjectStrict, interopZodTransformInputSchema, isZodObjectV4, isZodSchemaV3, isZodSchemaV4 } from "./types/zod.js";
import { zodToJsonSchema } from "./zod-to-json-schema/zodToJsonSchema.js";
import "./zod-to-json-schema/index.js";
import { toJSONSchema } from "zod/v4/core";
import { Validator, deepCompareStrict, dereference } from "@cfworker/json-schema";

//#region src/utils/json_schema.ts
var json_schema_exports = {};
__export(json_schema_exports, {
	Validator: () => Validator,
	deepCompareStrict: () => deepCompareStrict,
	toJsonSchema: () => toJsonSchema,
	validatesOnlyStrings: () => validatesOnlyStrings
});
/**
* Converts a Zod schema or JSON schema to a JSON schema.
* @param schema - The schema to convert.
* @param params - The parameters to pass to the toJSONSchema function.
* @returns The converted schema.
*/
function toJsonSchema(schema, params) {
	if (isZodSchemaV4(schema)) {
		const inputSchema = interopZodTransformInputSchema(schema, true);
		if (isZodObjectV4(inputSchema)) {
			const strictSchema = interopZodObjectStrict(inputSchema, true);
			return toJSONSchema(strictSchema, params);
		} else return toJSONSchema(schema, params);
	}
	if (isZodSchemaV3(schema)) return zodToJsonSchema(schema);
	return schema;
}
/**
* Validates if a JSON schema validates only strings. May return false negatives in some edge cases
* (like recursive or unresolvable refs).
*
* @param schema - The schema to validate.
* @returns `true` if the schema validates only strings, `false` otherwise.
*/
function validatesOnlyStrings(schema) {
	if (!schema || typeof schema !== "object" || Object.keys(schema).length === 0 || Array.isArray(schema)) return false;
	if ("type" in schema) {
		if (typeof schema.type === "string") return schema.type === "string";
		if (Array.isArray(schema.type)) return schema.type.every((t) => t === "string");
		return false;
	}
	if ("enum" in schema) return Array.isArray(schema.enum) && schema.enum.length > 0 && schema.enum.every((val) => typeof val === "string");
	if ("const" in schema) return typeof schema.const === "string";
	if ("allOf" in schema && Array.isArray(schema.allOf)) return schema.allOf.some((subschema) => validatesOnlyStrings(subschema));
	if ("anyOf" in schema && Array.isArray(schema.anyOf) || "oneOf" in schema && Array.isArray(schema.oneOf)) {
		const subschemas = "anyOf" in schema ? schema.anyOf : schema.oneOf;
		return subschemas.length > 0 && subschemas.every((subschema) => validatesOnlyStrings(subschema));
	}
	if ("not" in schema) return false;
	if ("$ref" in schema && typeof schema.$ref === "string") {
		const ref = schema.$ref;
		const resolved = dereference(schema);
		if (resolved[ref]) return validatesOnlyStrings(resolved[ref]);
		return false;
	}
	return false;
}

//#endregion
export { Validator, deepCompareStrict, json_schema_exports, toJsonSchema, validatesOnlyStrings };
//# sourceMappingURL=json_schema.js.map