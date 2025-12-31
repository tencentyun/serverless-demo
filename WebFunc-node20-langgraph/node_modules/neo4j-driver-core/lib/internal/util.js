"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENCRYPTION_OFF = exports.ENCRYPTION_ON = exports.equals = exports.validateQueryAndParameters = exports.toNumber = exports.assertValidDate = exports.assertNumberOrInteger = exports.assertNumber = exports.assertString = exports.assertObject = exports.isString = exports.isObject = exports.isEmptyObjectOrNull = void 0;
/**
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [https://neo4j.com]
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var integer_1 = __importStar(require("../integer"));
var json_1 = require("../json");
var ENCRYPTION_ON = 'ENCRYPTION_ON';
exports.ENCRYPTION_ON = ENCRYPTION_ON;
var ENCRYPTION_OFF = 'ENCRYPTION_OFF';
exports.ENCRYPTION_OFF = ENCRYPTION_OFF;
/**
 * Verifies if the object is null or empty
 * @param obj The subject object
 * @returns {boolean} True if it's empty object or null
 */
function isEmptyObjectOrNull(obj) {
    if (obj === null) {
        return true;
    }
    if (!isObject(obj)) {
        return false;
    }
    for (var prop in obj) {
        if (obj[prop] !== undefined) {
            return false;
        }
    }
    return true;
}
exports.isEmptyObjectOrNull = isEmptyObjectOrNull;
/**
 * Verify if it's an object
 * @param obj The subject
 * @returns {boolean} True if it's an object
 */
function isObject(obj) {
    return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}
exports.isObject = isObject;
/**
 * Check and normalize given query and parameters.
 * @param {string|{text: string, parameters: Object}} query the query to check.
 * @param {Object} parameters
 * @return {{validatedQuery: string|{text: string, parameters: Object}, params: Object}} the normalized query with parameters.
 * @throws TypeError when either given query or parameters are invalid.
 */
function validateQueryAndParameters(query, parameters, opt) {
    var _a, _b;
    var validatedQuery = '';
    var params = parameters !== null && parameters !== void 0 ? parameters : {};
    var skipAsserts = (_a = opt === null || opt === void 0 ? void 0 : opt.skipAsserts) !== null && _a !== void 0 ? _a : false;
    if (typeof query === 'string') {
        validatedQuery = query;
    }
    else if (query instanceof String) {
        validatedQuery = query.toString();
    }
    else if (typeof query === 'object' && query.text != null) {
        validatedQuery = query.text;
        params = (_b = query.parameters) !== null && _b !== void 0 ? _b : {};
    }
    if (!skipAsserts) {
        assertCypherQuery(validatedQuery);
        assertQueryParameters(params);
    }
    return { validatedQuery: validatedQuery, params: params };
}
exports.validateQueryAndParameters = validateQueryAndParameters;
/**
 * Assert it's a object
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {object} The subject object
 * @throws {TypeError} when the supplied param is not an object
 */
function assertObject(obj, objName) {
    if (!isObject(obj)) {
        throw new TypeError(objName + ' expected to be an object but was: ' + (0, json_1.stringify)(obj));
    }
    return obj;
}
exports.assertObject = assertObject;
/**
 * Assert it's a string
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {string} The subject string
 * @throws {TypeError} when the supplied param is not a string
 */
function assertString(obj, objName) {
    if (!isString(obj)) {
        throw new TypeError((0, json_1.stringify)(objName) + ' expected to be string but was: ' + (0, json_1.stringify)(obj));
    }
    return obj;
}
exports.assertString = assertString;
/**
 * Assert it's a number
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {number} The number
 * @throws {TypeError} when the supplied param is not a number
 */
function assertNumber(obj, objName) {
    if (typeof obj !== 'number') {
        throw new TypeError(objName + ' expected to be a number but was: ' + (0, json_1.stringify)(obj));
    }
    return obj;
}
exports.assertNumber = assertNumber;
/**
 * Assert it's a number or integer
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {number|Integer} The subject object
 * @throws {TypeError} when the supplied param is not a number or integer
 */
function assertNumberOrInteger(obj, objName) {
    if (typeof obj !== 'number' && typeof obj !== 'bigint' && !(0, integer_1.isInt)(obj)) {
        throw new TypeError(objName +
            ' expected to be either a number or an Integer object but was: ' +
            (0, json_1.stringify)(obj));
    }
    return obj;
}
exports.assertNumberOrInteger = assertNumberOrInteger;
/**
 * Assert it's a valid datae
 * @param {any} obj The subject
 * @param {string} objName The object name
 * @returns {Date} The valida date
 * @throws {TypeError} when the supplied param is not a valid date
 */
function assertValidDate(obj, objName) {
    if (Object.prototype.toString.call(obj) !== '[object Date]') {
        throw new TypeError(objName +
            ' expected to be a standard JavaScript Date but was: ' +
            (0, json_1.stringify)(obj));
    }
    if (Number.isNaN(obj.getTime())) {
        throw new TypeError(objName +
            ' expected to be valid JavaScript Date but its time was NaN: ' +
            (0, json_1.stringify)(obj));
    }
    return obj;
}
exports.assertValidDate = assertValidDate;
/**
 * Validates a cypher query string
 * @param {any} obj The query
 * @returns {void}
 * @throws {TypeError} if the query is not valid
 */
function assertCypherQuery(obj) {
    assertString(obj, 'Cypher query');
    if (obj.trim().length === 0) {
        throw new TypeError('Cypher query is expected to be a non-empty string.');
    }
}
/**
 * Validates if the query parameters is an object
 * @param {any} obj The parameters
 * @returns {void}
 * @throws {TypeError} if the parameters is not valid
 */
function assertQueryParameters(obj) {
    if (!isObject(obj)) {
        // objects created with `Object.create(null)` do not have a constructor property
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        var constructor = obj.constructor != null ? ' ' + obj.constructor.name : '';
        throw new TypeError("Query parameters are expected to either be undefined/null or an object, given:".concat(constructor, " ").concat(JSON.stringify(obj)));
    }
}
/**
 * Verify if the supplied object is a string
 *
 * @param str The string
 * @returns {boolean} True if the supplied object is an string
 */
function isString(str) {
    return Object.prototype.toString.call(str) === '[object String]';
}
exports.isString = isString;
/**
 * Verifies if object are the equals
 * @param {unknown} a
 * @param {unknown} b
 * @returns {boolean}
 */
function equals(a, b) {
    var e_1, _a;
    if (a === b) {
        return true;
    }
    if (a === null || b === null) {
        return false;
    }
    if (typeof a === 'object' && typeof b === 'object') {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        if (keysA.length !== keysB.length) {
            return false;
        }
        try {
            for (var keysA_1 = __values(keysA), keysA_1_1 = keysA_1.next(); !keysA_1_1.done; keysA_1_1 = keysA_1.next()) {
                var key = keysA_1_1.value;
                if (!equals(a[key], b[key])) {
                    return false;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keysA_1_1 && !keysA_1_1.done && (_a = keysA_1.return)) _a.call(keysA_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return true;
    }
    return false;
}
exports.equals = equals;
/**
 * Converts (Integer | bigint) to number.
 *
 * @private
 * @param {NumberOrInteger} value The number or integer
 * @returns {number} The number
 */
function toNumber(value) {
    if (value instanceof integer_1.default) {
        return value.toNumber();
    }
    else if (typeof value === 'bigint') {
        return (0, integer_1.int)(value).toNumber();
    }
    else {
        return value;
    }
}
exports.toNumber = toNumber;
