/**
 * ContextValues is a collection of context values.
 */
export interface ContextValues {
    /**
     * get returns a context value.
     */
    get<T>(key: ContextKey<T>): T;
    /**
     * set sets a context value. It returns the ContextValues to allow chaining.
     */
    set<T>(key: ContextKey<T>, value: T): this;
    /**
     * delete deletes a context value. It returns the ContextValues to allow chaining.
     */
    delete(key: ContextKey<unknown>): this;
}
/**
 * createContextValues creates a new ContextValues.
 */
export declare function createContextValues(): ContextValues;
/**
 * ContextKey is a unique identifier for a context value.
 */
export type ContextKey<T> = {
    id: symbol;
    defaultValue: T;
};
/**
 * createContextKey creates a new ContextKey.
 */
export declare function createContextKey<T>(defaultValue: T, options?: {
    description?: string;
}): ContextKey<T>;
