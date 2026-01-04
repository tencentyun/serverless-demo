const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const decamelize = require_rolldown_runtime.__toESM(require("decamelize"));
const camelcase = require_rolldown_runtime.__toESM(require("camelcase"));

//#region src/load/map_keys.ts
function keyToJson(key, map) {
	return map?.[key] || (0, decamelize.default)(key);
}
function keyFromJson(key, map) {
	return map?.[key] || (0, camelcase.default)(key);
}
function mapKeys(fields, mapper, map) {
	const mapped = {};
	for (const key in fields) if (Object.hasOwn(fields, key)) mapped[mapper(key, map)] = fields[key];
	return mapped;
}

//#endregion
exports.keyFromJson = keyFromJson;
exports.keyToJson = keyToJson;
exports.mapKeys = mapKeys;
//# sourceMappingURL=map_keys.cjs.map