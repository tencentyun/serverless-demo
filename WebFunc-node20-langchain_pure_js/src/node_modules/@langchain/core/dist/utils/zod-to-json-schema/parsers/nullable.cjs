const require_union = require('./union.cjs');
const require_parseDef = require('../parseDef.cjs');

//#region src/utils/zod-to-json-schema/parsers/nullable.ts
function parseNullableDef(def, refs) {
	if ([
		"ZodString",
		"ZodNumber",
		"ZodBigInt",
		"ZodBoolean",
		"ZodNull"
	].includes(def.innerType._def.typeName) && (!def.innerType._def.checks || !def.innerType._def.checks.length)) {
		if (refs.target === "openApi3") return {
			type: require_union.primitiveMappings[def.innerType._def.typeName],
			nullable: true
		};
		return { type: [require_union.primitiveMappings[def.innerType._def.typeName], "null"] };
	}
	if (refs.target === "openApi3") {
		const base$1 = require_parseDef.parseDef(def.innerType._def, {
			...refs,
			currentPath: [...refs.currentPath]
		});
		if (base$1 && "$ref" in base$1) return {
			allOf: [base$1],
			nullable: true
		};
		return base$1 && {
			...base$1,
			nullable: true
		};
	}
	const base = require_parseDef.parseDef(def.innerType._def, {
		...refs,
		currentPath: [
			...refs.currentPath,
			"anyOf",
			"0"
		]
	});
	return base && { anyOf: [base, { type: "null" }] };
}

//#endregion
exports.parseNullableDef = parseNullableDef;
//# sourceMappingURL=nullable.cjs.map