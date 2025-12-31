//#region src/utils/error.ts
const isError = (error) => {
	if ("isError" in Error && typeof Error.isError === "function") return Error.isError(error);
	const stringTag = Object.prototype.toString.call(error);
	return stringTag === "[object Error]" || stringTag === "[object DOMException]" || stringTag === "[object DOMError]" || stringTag === "[object Exception]";
};
const isNetworkError = (error) => {
	if (!isError(error)) return false;
	if (error.name !== "TypeError" || typeof error.message !== "string") return false;
	const msg = error.message.toLowerCase();
	return msg.includes("fetch") || msg.includes("network") || msg.includes("connection") || msg.includes("error sending request") || msg.includes("load failed");
};

//#endregion
export { isNetworkError };
//# sourceMappingURL=error.js.map