/**
 * Creates a object which all method call will throw the given error
 *
 * @param {Error} error The error
 * @param {any} object The object. Default: {}
 * @returns {any} A broken object
 */
declare function createBrokenObject<T extends object>(error: Error, object?: any): T;
/**
 * Verifies if it is a Broken Object
 * @param {any} object The object
 * @returns {boolean} If it was created with createBrokenObject
 */
declare function isBrokenObject(object: any): boolean;
/**
 * Returns if the reason the object is broken.
 *
 * This method should only be called with instances create with {@link createBrokenObject}
 *
 * @param {any} object The object
 * @returns {Error} The reason the object is broken
 */
declare function getBrokenObjectReason(object: any): Error;
export { createBrokenObject, isBrokenObject, getBrokenObjectReason };
