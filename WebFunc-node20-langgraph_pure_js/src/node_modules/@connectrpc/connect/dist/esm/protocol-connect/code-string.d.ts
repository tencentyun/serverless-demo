import { Code } from "../code.js";
/**
 * codeToString returns the string representation of a Code.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function codeToString(value: Code): string;
/**
 * codeFromString parses the string representation of a Code in snake_case.
 * For example, the string "permission_denied" parses into Code.PermissionDenied.
 *
 * If the given string cannot be parsed, the function returns undefined.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function codeFromString(value: string): Code | undefined;
