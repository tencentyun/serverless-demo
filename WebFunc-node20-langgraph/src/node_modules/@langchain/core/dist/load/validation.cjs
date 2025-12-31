
//#region src/load/validation.ts
/**
* Sentinel key used to mark escaped user objects during serialization.
*
* When a plain object contains 'lc' key (which could be confused with LC objects),
* we wrap it as `{"__lc_escaped__": {...original...}}`.
*/
const LC_ESCAPED_KEY = "__lc_escaped__";
/**
* Check if an object needs escaping to prevent confusion with LC objects.
*
* An object needs escaping if:
* 1. It has an `'lc'` key (could be confused with LC serialization format)
* 2. It has only the escape key (would be mistaken for an escaped object)
*/
function needsEscaping(obj) {
	return "lc" in obj || Object.keys(obj).length === 1 && LC_ESCAPED_KEY in obj;
}
/**
* Wrap an object in the escape marker.
*
* @example
* ```typescript
* {"key": "value"}  // becomes {"__lc_escaped__": {"key": "value"}}
* ```
*/
function escapeObject(obj) {
	return { [LC_ESCAPED_KEY]: obj };
}
/**
* Check if an object is an escaped user object.
*
* @example
* ```typescript
* {"__lc_escaped__": {...}}  // is an escaped object
* ```
*/
function isEscapedObject(obj) {
	return Object.keys(obj).length === 1 && LC_ESCAPED_KEY in obj;
}
/**
* Check if an object looks like a Serializable instance (duck typing).
*/
function isSerializableLike(obj) {
	return obj !== null && typeof obj === "object" && "lc_serializable" in obj && typeof obj.toJSON === "function";
}
/**
* Escape a value if it needs escaping (contains `lc` key).
*
* This is a simpler version of `serializeValue` that doesn't handle Serializable
* objects - it's meant to be called on kwargs values that have already been
* processed by `toJSON()`.
*
* @param value - The value to potentially escape.
* @returns The value with any `lc`-containing objects wrapped in escape markers.
*/
function escapeIfNeeded(value) {
	if (value !== null && typeof value === "object" && !Array.isArray(value)) {
		if (isSerializableLike(value)) return value;
		const record = value;
		if (needsEscaping(record)) return escapeObject(record);
		const result = {};
		for (const [key, val] of Object.entries(record)) result[key] = escapeIfNeeded(val);
		return result;
	}
	if (Array.isArray(value)) return value.map((item) => escapeIfNeeded(item));
	return value;
}
/**
* Unescape a value, processing escape markers in object values and arrays.
*
* When an escaped object is encountered (`{"__lc_escaped__": ...}`), it's
* unwrapped and the contents are returned AS-IS (no further processing).
* The contents represent user data that should not be modified.
*
* For regular objects and arrays, we recurse to find any nested escape markers.
*
* @param obj - The value to unescape.
* @returns The unescaped value.
*/
function unescapeValue(obj) {
	if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
		const record = obj;
		if (isEscapedObject(record)) return record[LC_ESCAPED_KEY];
		const result = {};
		for (const [key, value] of Object.entries(record)) result[key] = unescapeValue(value);
		return result;
	}
	if (Array.isArray(obj)) return obj.map((item) => unescapeValue(item));
	return obj;
}

//#endregion
exports.escapeIfNeeded = escapeIfNeeded;
exports.isEscapedObject = isEscapedObject;
exports.unescapeValue = unescapeValue;
//# sourceMappingURL=validation.cjs.map