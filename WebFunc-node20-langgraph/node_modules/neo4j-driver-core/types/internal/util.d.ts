import { NumberOrInteger } from '../graph-types';
import { EncryptionLevel } from '../types';
declare const ENCRYPTION_ON: EncryptionLevel;
declare const ENCRYPTION_OFF: EncryptionLevel;
/**
 * Verifies if the object is null or empty
 * @param obj The subject object
 * @returns {boolean} True if it's empty object or null
 */
declare function isEmptyObjectOrNull(obj?: any): boolean;
/**
 * Verify if it's an object
 * @param obj The subject
 * @returns {boolean} True if it's an object
 */
declare function isObject(obj: any): boolean;
/**
 * Check and normalize given query and parameters.
 * @param {string|{text: string, parameters: Object}} query the query to check.
 * @param {Object} parameters
 * @return {{validatedQuery: string|{text: string, parameters: Object}, params: Object}} the normalized query with parameters.
 * @throws TypeError when either given query or parameters are invalid.
 */
declare function validateQueryAndParameters(query: string | String | {
    text: string;
    parameters?: any;
}, parameters?: any, opt?: {
    skipAsserts: boolean;
}): {
    validatedQuery: string;
    params: any;
};
/**
 * Assert it's a object
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {object} The subject object
 * @throws {TypeError} when the supplied param is not an object
 */
declare function assertObject(obj: any, objName: string): Object;
/**
 * Assert it's a string
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {string} The subject string
 * @throws {TypeError} when the supplied param is not a string
 */
declare function assertString(obj: any, objName: Object): string;
/**
 * Assert it's a number
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {number} The number
 * @throws {TypeError} when the supplied param is not a number
 */
declare function assertNumber(obj: any, objName: string): number;
/**
 * Assert it's a number or integer
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {number|Integer} The subject object
 * @throws {TypeError} when the supplied param is not a number or integer
 */
declare function assertNumberOrInteger(obj: any, objName: string): NumberOrInteger;
/**
 * Assert it's a valid datae
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {Date} The valida date
 * @throws {TypeError} when the supplied param is not a valid date
 */
declare function assertValidDate(obj: any, objName: string): Date;
/**
 * Verify if the supplied object is a string
 *
 * @param str The string
 * @returns {boolean} True if the supplied object is an string
 */
declare function isString(str: any): str is string;
/**
 * Verifies if object are the equals
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
declare function equals(a: unknown, b: unknown): boolean;
/**
 * Converts (Integer | bigint) to number.
 *
 * @private
 * @param {NumberOrInteger} value The number or integer
 * @returns {number} The number
 */
declare function toNumber(value: NumberOrInteger): number;
export { isEmptyObjectOrNull, isObject, isString, assertObject, assertString, assertNumber, assertNumberOrInteger, assertValidDate, toNumber, validateQueryAndParameters, equals, ENCRYPTION_ON, ENCRYPTION_OFF };
