/**
 * A function that returns true if a given mime type is supported.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export interface ContentTypeMatcher {
    (contentType: string | null): boolean;
    supported: RegExp[];
}
/**
 * Create a function that returns true if the given mime type is supported.
 * A mime type is supported when one of the regular expressions match.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function contentTypeMatcher(...supported: (RegExp | Pick<ContentTypeMatcher, "supported">)[]): ContentTypeMatcher;
