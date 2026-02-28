Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
const require_runtime = require('../../_virtual/_rolldown/runtime.cjs');

//#region src/retrievers/document_compressors/index.ts
var document_compressors_exports = /* @__PURE__ */ require_runtime.__exportAll({ BaseDocumentCompressor: () => BaseDocumentCompressor });
/**
* Base Document Compression class. All compressors should extend this class.
*/
var BaseDocumentCompressor = class {
	static isBaseDocumentCompressor(x) {
		return x?.compressDocuments !== void 0;
	}
};

//#endregion
exports.BaseDocumentCompressor = BaseDocumentCompressor;
Object.defineProperty(exports, 'document_compressors_exports', {
  enumerable: true,
  get: function () {
    return document_compressors_exports;
  }
});
//# sourceMappingURL=index.cjs.map