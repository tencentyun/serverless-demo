import { parseJsonMarkdown, parsePartialJson } from "../utils/json.js";
import { compare } from "../utils/fast-json-patch/src/duplex.js";
import { BaseCumulativeTransformOutputParser } from "./transform.js";
import "../utils/json_patch.js";

//#region src/output_parsers/json.ts
/**
* Class for parsing the output of an LLM into a JSON object.
*/
var JsonOutputParser = class extends BaseCumulativeTransformOutputParser {
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
		return compare(prev, next);
	}
	async parsePartialResult(generations) {
		return parseJsonMarkdown(generations[0].text);
	}
	async parse(text) {
		return parseJsonMarkdown(text, JSON.parse);
	}
	getFormatInstructions() {
		return "";
	}
};

//#endregion
export { JsonOutputParser };
//# sourceMappingURL=json.js.map