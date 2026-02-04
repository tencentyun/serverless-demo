import { __export } from "../_virtual/rolldown_runtime.js";

//#region src/utils/chunk_array.ts
var chunk_array_exports = {};
__export(chunk_array_exports, { chunkArray: () => chunkArray });
const chunkArray = (arr, chunkSize) => arr.reduce((chunks, elem, index) => {
	const chunkIndex = Math.floor(index / chunkSize);
	const chunk = chunks[chunkIndex] || [];
	chunks[chunkIndex] = chunk.concat([elem]);
	return chunks;
}, []);

//#endregion
export { chunkArray, chunk_array_exports };
//# sourceMappingURL=chunk_array.js.map