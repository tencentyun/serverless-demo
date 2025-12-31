const require_rolldown_runtime = require('../_virtual/rolldown_runtime.cjs');

//#region src/utils/chunk_array.ts
var chunk_array_exports = {};
require_rolldown_runtime.__export(chunk_array_exports, { chunkArray: () => chunkArray });
const chunkArray = (arr, chunkSize) => arr.reduce((chunks, elem, index) => {
	const chunkIndex = Math.floor(index / chunkSize);
	const chunk = chunks[chunkIndex] || [];
	chunks[chunkIndex] = chunk.concat([elem]);
	return chunks;
}, []);

//#endregion
exports.chunkArray = chunkArray;
Object.defineProperty(exports, 'chunk_array_exports', {
  enumerable: true,
  get: function () {
    return chunk_array_exports;
  }
});
//# sourceMappingURL=chunk_array.cjs.map