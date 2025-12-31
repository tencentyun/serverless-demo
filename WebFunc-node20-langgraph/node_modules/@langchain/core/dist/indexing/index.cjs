const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_record_manager = require('./record_manager.cjs');
const require_base = require('./base.cjs');

//#region src/indexing/index.ts
var indexing_exports = {};
require_rolldown_runtime.__export(indexing_exports, {
	RecordManager: () => require_record_manager.RecordManager,
	UUIDV5_NAMESPACE: () => require_record_manager.UUIDV5_NAMESPACE,
	_HashedDocument: () => require_base._HashedDocument,
	_batch: () => require_base._batch,
	_deduplicateInOrder: () => require_base._deduplicateInOrder,
	_getSourceIdAssigner: () => require_base._getSourceIdAssigner,
	_isBaseDocumentLoader: () => require_base._isBaseDocumentLoader,
	index: () => require_base.index
});

//#endregion
exports.RecordManager = require_record_manager.RecordManager;
exports.UUIDV5_NAMESPACE = require_record_manager.UUIDV5_NAMESPACE;
exports._HashedDocument = require_base._HashedDocument;
exports._batch = require_base._batch;
exports._deduplicateInOrder = require_base._deduplicateInOrder;
exports._getSourceIdAssigner = require_base._getSourceIdAssigner;
exports._isBaseDocumentLoader = require_base._isBaseDocumentLoader;
exports.index = require_base.index;
Object.defineProperty(exports, 'indexing_exports', {
  enumerable: true,
  get: function () {
    return indexing_exports;
  }
});
//# sourceMappingURL=index.cjs.map