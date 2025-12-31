const require_json = require('../utils/json.cjs');
const require_duplex = require('../utils/fast-json-patch/src/duplex.cjs');
const require_transform = require('./transform.cjs');
require('../utils/json_patch.cjs');

//#region src/output_parsers/json.ts
/**
* Class for parsing the output of an LLM into a JSON object.
*/
var JsonOutputParser = class extends require_transform.BaseCumulativeTransformOutputParser {
	static lc_name() {
		return "JsonOutputParser";
	}
	lc_namespace = ["langchain_core", "output_parsers"];
	lc_serializable = true;
	/** @internal */
	_concatOutputChunks(first, second) {
		if (this.diff) return super._concatOutputChunks(first, second);
		return second;
	}
	_diff(prev, next) {
		if (!next) return void 0;
		if (!prev) return [{
			op: "replace",
			path: "",
			value: next
		}];
		return require_duplex.compare(prev, next);
	}
	async parsePartialResult(generations) {
		return require_json.parseJsonMarkdown(generations[0].text);
	}
	async parse(text) {
		return require_json.parseJsonMarkdown(text, JSON.parse);
	}
	getFormatInstructions() {
		return "";
	}
};

//#endregion
exports.JsonOutputParser = JsonOutputParser;
//# sourceMappingURL=json.cjs.map