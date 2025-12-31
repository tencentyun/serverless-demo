/**
 * Sentinel key used to mark escaped user objects during serialization.
 *
 * When a plain object contains 'lc' key (which could be confused with LC objects),
 * we wrap it as `{"__lc_escaped__": {...original...}}`.
 */
export declare const LC_ESCAPED_KEY = "__lc_escaped__";
/**
 * Check if an object needs escaping to prevent confusion with LC objects.
 *
 * An object needs escaping if:
 * 1. It has an `'lc'` key (could be confused with LC serialization format)
 * 2. It has only the escape key (would be mistaken for an escaped object)
 */
export declare function needsEscaping(obj: Record<string, unknown>): boolean;
/**
 * Wrap an object in the escape marker.
 *
 * @example
 * ```typescript
 * {"key": "value"}  // becomes {"__lc_escaped__": {"key": "value"}}
 * ```
 */
export declare function escapeObject(obj: Record<string, unknown>): Record<string, unknown>;
/**
 * Check if an object is an escaped user object.
 *
 * @example
 * ```typescript
 * {"__lc_escaped__": {...}}  // is an escaped object
 * ```
 */
export declare function isEscapedObject(obj: Record<string, unknown>): boolean;
/**
 * Interface for objects that can be serialized.
 * This is a duck-typed interface to avoid circular imports.
 */
interface SerializableLike {
    lc_serializable: boolean;
    lc_secrets?: Record<string, string>;
    toJSON(): {
        lc: number;
        type: string;
        id: string[];
        kwargs?: Record<string, unknown>;
    };
}
/**
 * Serialize a value with escaping of user objects.
 *
 * Called recursively on kwarg values to escape any plain objects that could be
 * confused with LC objects.
 *
 * @param obj - The value to serialize.
 * @returns The serialized value with user objects escaped as needed.
 */
export declare function serializeValue(obj: unknown): unknown;
/**
 * Serialize a `Serializable` object with escaping of user data in kwargs.
 *
 * @param obj - The `Serializable` object to serialize.
 * @returns The serialized object with user data in kwargs escaped as needed.
 *
 * @remarks
 * Kwargs values are processed with `serializeValue` to escape user data (like
 * metadata) that contains `'lc'` keys. Secret fields (from `lc_secrets`) are
 * skipped because `toJSON()` replaces their values with secret markers.
 */
export declare function serializeLcObject(obj: SerializableLike): {
    lc: number;
    type: string;
    id: string[];
    kwargs?: Record<string, unknown>;
};
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
export declare function escapeIfNeeded(value: unknown): unknown;
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
export declare function unescapeValue(obj: unknown): unknown;
export {};
