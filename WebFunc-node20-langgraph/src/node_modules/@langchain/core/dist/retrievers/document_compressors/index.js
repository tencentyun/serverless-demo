import { __export } from "../../_virtual/rolldown_runtime.js";

//#region src/retrievers/document_compressors/index.ts
var document_compressors_exports = {};
__export(document_compressors_exports, { BaseDocumentCompressor: () => BaseDocumentCompressor });
/**
* Base Document Compression class. All compressors should extend this class.
*/
var BaseDocumentCompressor = class {
	static isBaseDocumentCompressor(x) {
		return x?.compressDocuments !== void 0;
	}
};

//#endregion
export { BaseDocumentCompressor, document_compressors_exports };
//# sourceMappingURL=index.js.map