const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');

//#region src/document_loaders/base.ts
var base_exports = {};
require_rolldown_runtime.__export(base_exports, { BaseDocumentLoader: () => BaseDocumentLoader });
/**
* Abstract class that provides a default implementation for the
* loadAndSplit() method from the DocumentLoader interface. The load()
* method is left abstract and needs to be implemented by subclasses.
*/
var BaseDocumentLoader = class {};

//#endregion
exports.BaseDocumentLoader = BaseDocumentLoader;
Object.defineProperty(exports, 'base_exports', {
  enumerable: true,
  get: function () {
    return base_exports;
  }
});
//# sourceMappingURL=base.cjs.map