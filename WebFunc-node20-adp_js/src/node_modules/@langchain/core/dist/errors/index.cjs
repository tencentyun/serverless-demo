const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');

//#region src/errors/index.ts
var errors_exports = {};
require_rolldown_runtime.__export(errors_exports, {
	ModelAbortError: () => ModelAbortError,
	addLangChainErrorFields: () => addLangChainErrorFields
});
function addLangChainErrorFields(error, lc_error_code) {
	error.lc_error_code = lc_error_code;
	error.message = `${error.message}\n\nTroubleshooting URL: https://docs.langchain.com/oss/javascript/langchain/errors/${lc_error_code}/\n`;
	return error;
}
/**
* Error thrown when a model invocation is aborted via an AbortSignal.
* Contains any partial output that was generated before the abort.
*/
var ModelAbortError = class ModelAbortError extends Error {
	name = "ModelAbortError";
	lc_error_code = "MODEL_ABORTED";
	/**
	* The partial message output that was accumulated before the abort.
	* This allows callers to access whatever content was generated
	* before the operation was cancelled.
	*/
	partialOutput;
	constructor(message, partialOutput) {
		super(message);
		this.partialOutput = partialOutput;
		if (Error.captureStackTrace) Error.captureStackTrace(this, ModelAbortError);
	}
	/**
	* Type guard to check if an error is a ModelAbortError
	*/
	static isInstance(error) {
		return typeof error === "object" && error !== null && "name" in error && error.name === "ModelAbortError" && "lc_error_code" in error && error.lc_error_code === "MODEL_ABORTED";
	}
};

//#endregion
exports.ModelAbortError = ModelAbortError;
exports.addLangChainErrorFields = addLangChainErrorFields;
Object.defineProperty(exports, 'errors_exports', {
  enumerable: true,
  get: function () {
    return errors_exports;
  }
});
//# sourceMappingURL=index.cjs.map