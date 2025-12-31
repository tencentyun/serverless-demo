const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');
const require_document = require('./document.cjs');
const require_transformers = require('./transformers.cjs');

//#region src/documents/index.ts
var documents_exports = {};
require_rolldown_runtime.__export(documents_exports, {
	BaseDocumentTransformer: () => require_transformers.BaseDocumentTransformer,
	Document: () => require_document.Document,
	MappingDocumentTransformer: () => require_transformers.MappingDocumentTransformer
});

//#endregion
exports.BaseDocumentTransformer = require_transformers.BaseDocumentTransformer;
exports.Document = require_document.Document;
exports.MappingDocumentTransformer = require_transformers.MappingDocumentTransformer;
Object.defineProperty(exports, 'documents_exports', {
  enumerable: true,
  get: function () {
    return documents_exports;
  }
});
//# sourceMappingURL=index.cjs.map