const require_utils = require('../middleware/utils.cjs');
const require_middleware = require('./middleware.cjs');

//#region src/agents/nodes/BeforeModelNode.ts
/**
* Node for executing a single middleware's beforeModel hook.
*/
var BeforeModelNode = class extends require_middleware.MiddlewareNode {
	lc_namespace = [
		"langchain",
		"agents",
		"beforeModelNodes"
	];
	constructor(middleware, options) {
		super({
			name: `BeforeModelNode_${middleware.name}`,
			func: async (state, config) => this.invokeMiddleware(state, config)
		}, options);
		this.middleware = middleware;
	}
	runHook(state, runtime) {
		const fn = require_utils.getHookFunction(this.middleware.beforeModel);
		return fn(state, runtime);
	}
};

//#endregion
exports.BeforeModelNode = BeforeModelNode;
//# sourceMappingURL=BeforeModelNode.cjs.map