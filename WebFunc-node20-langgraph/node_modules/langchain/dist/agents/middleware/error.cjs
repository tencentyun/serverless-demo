const require_rolldown_runtime = require('../../_virtual/rolldown_runtime.cjs');
const zod_v4 = require_rolldown_runtime.__toESM(require("zod/v4"));

//#region src/agents/middleware/error.ts
/**
* Error thrown when the configuration for a retry middleware is invalid.
*/
var InvalidRetryConfigError = class extends Error {
	cause;
	constructor(error) {
		const message = zod_v4.z.prettifyError(error).slice(2);
		super(message);
		this.name = "InvalidRetryConfigError";
		this.cause = error;
	}
};

//#endregion
exports.InvalidRetryConfigError = InvalidRetryConfigError;
//# sourceMappingURL=error.cjs.map