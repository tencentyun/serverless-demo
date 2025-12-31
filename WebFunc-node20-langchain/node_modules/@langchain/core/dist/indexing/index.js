import { __export } from "../_virtual/rolldown_runtime.js";
import { RecordManager, UUIDV5_NAMESPACE } from "./record_manager.js";
import { _HashedDocument, _batch, _deduplicateInOrder, _getSourceIdAssigner, _isBaseDocumentLoader, index } from "./base.js";

//#region src/indexing/index.ts
var indexing_exports = {};
__export(indexing_exports, {
	RecordManager: () => RecordManager,
	UUIDV5_NAMESPACE: () => UUIDV5_NAMESPACE,
	_HashedDocument: () => _HashedDocument,
	_batch: () => _batch,
	_deduplicateInOrder: () => _deduplicateInOrder,
	_getSourceIdAssigner: () => _getSourceIdAssigner,
	_isBaseDocumentLoader: () => _isBaseDocumentLoader,
	index: () => index
});

//#endregion
export { RecordManager, UUIDV5_NAMESPACE, _HashedDocument, _batch, _deduplicateInOrder, _getSourceIdAssigner, _isBaseDocumentLoader, index, indexing_exports };
//# sourceMappingURL=index.js.map