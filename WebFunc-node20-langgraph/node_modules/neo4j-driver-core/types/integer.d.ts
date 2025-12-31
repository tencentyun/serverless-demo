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
/**
 * Constructs a 64 bit two's-complement integer, given its low and high 32 bit values as *signed* integers.
 * See exported functions for more convenient ways of operating integers.
 * Use `int()` function to create new integers, `isInt()` to check if given object is integer,
 * `inSafeRange()` to check if it is safe to convert given value to native number,
 * `toNumber()` and `toString()` to convert given integer to number or string respectively.
 * @access public
 * @exports Integer
 * @class A Integer class for representing a 64 bit two's-complement integer value.
 * @param {number} low The low (signed) 32 bits of the long
 * @param {number} high The high (signed) 32 bits of the long
 *
 * @constructor
 */
declare class Integer {
    low: number;
    high: number;
    constructor(low?: number, high?: number);
    inSafeRange(): boolean;
    /**
     * Converts the Integer to an exact javascript Number, assuming it is a 32 bit integer.
     * @returns {number}
     * @expose
     */
    toInt(): number;
    /**
     * Converts the Integer to a the nearest floating-point representation of this value (double, 53 bit mantissa).
     * @returns {number}
     * @expose
     */
    toNumber(): number;
    /**
     * Converts the Integer to a BigInt representation of this value
     * @returns {bigint}
     * @expose
     */
    toBigInt(): bigint;
    /**
     * Converts the Integer to native number or -Infinity/+Infinity when it does not fit.
     * @return {number}
     * @package
     */
    toNumberOrInfinity(): number;
    /**
     * Converts the Integer to a string written in the specified radix.
     * @param {number=} radix Radix (2-36), defaults to 10
     * @returns {string}
     * @override
     * @throws {RangeError} If `radix` is out of range
     * @expose
     */
    toString(radix?: number): string;
    /**
     * Converts the Integer to it primitive value.
     *
     * @since 5.4.0
     * @returns {bigint}
     *
     * @see {@link Integer#toBigInt}
     * @see {@link Integer#toInt}
     * @see {@link Integer#toNumber}
     * @see {@link Integer#toString}
     */
    valueOf(): bigint;
    /**
     * Gets the high 32 bits as a signed integer.
     * @returns {number} Signed high bits
     * @expose
     */
    getHighBits(): number;
    /**
     * Gets the low 32 bits as a signed integer.
     * @returns {number} Signed low bits
     * @expose
     */
    getLowBits(): number;
    /**
     * Gets the number of bits needed to represent the absolute value of this Integer.
     * @returns {number}
     * @expose
     */
    getNumBitsAbs(): number;
    /**
     * Tests if this Integer's value equals zero.
     * @returns {boolean}
     * @expose
     */
    isZero(): boolean;
    /**
     * Tests if this Integer's value is negative.
     * @returns {boolean}
     * @expose
     */
    isNegative(): boolean;
    /**
     * Tests if this Integer's value is positive.
     * @returns {boolean}
     * @expose
     */
    isPositive(): boolean;
    /**
     * Tests if this Integer's value is odd.
     * @returns {boolean}
     * @expose
     */
    isOdd(): boolean;
    /**
     * Tests if this Integer's value is even.
     * @returns {boolean}
     * @expose
     */
    isEven(): boolean;
    /**
     * Tests if this Integer's value equals the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    equals(other: Integerable): boolean;
    /**
     * Tests if this Integer's value differs from the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    notEquals(other: Integerable): boolean;
    /**
     * Tests if this Integer's value is less than the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    lessThan(other: Integerable): boolean;
    /**
     * Tests if this Integer's value is less than or equal the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    lessThanOrEqual(other: Integerable): boolean;
    /**
     * Tests if this Integer's value is greater than the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    greaterThan(other: Integerable): boolean;
    /**
     * Tests if this Integer's value is greater than or equal the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {boolean}
     * @expose
     */
    greaterThanOrEqual(other: Integerable): boolean;
    /**
     * Compares this Integer's value with the specified's.
     * @param {!Integer|number|string} other Other value
     * @returns {number} 0 if they are the same, 1 if the this is greater and -1
     *  if the given one is greater
     * @expose
     */
    compare(other: Integerable): number;
    /**
     * Negates this Integer's value.
     * @returns {!Integer} Negated Integer
     * @expose
     */
    negate(): Integer;
    /**
     * Returns the sum of this and the specified Integer.
     * @param {!Integer|number|string} addend Addend
     * @returns {!Integer} Sum
     * @expose
     */
    add(addend: Integerable): Integer;
    /**
     * Returns the difference of this and the specified Integer.
     * @param {!Integer|number|string} subtrahend Subtrahend
     * @returns {!Integer} Difference
     * @expose
     */
    subtract(subtrahend: Integerable): Integer;
    /**
     * Returns the product of this and the specified Integer.
     * @param {!Integer|number|string} multiplier Multiplier
     * @returns {!Integer} Product
     * @expose
     */
    multiply(multiplier: Integerable): Integer;
    /**
     * Returns this Integer divided by the specified.
     * @param {!Integer|number|string} divisor Divisor
     * @returns {!Integer} Quotient
     * @expose
     */
    div(divisor: Integerable): Integer;
    /**
     * Returns this Integer modulo the specified.
     * @param {!Integer|number|string} divisor Divisor
     * @returns {!Integer} Remainder
     * @expose
     */
    modulo(divisor: Integerable): Integer;
    /**
     * Returns the bitwise NOT of this Integer.
     * @returns {!Integer}
     * @expose
     */
    not(): Integer;
    /**
     * Returns the bitwise AND of this Integer and the specified.
     * @param {!Integer|number|string} other Other Integer
     * @returns {!Integer}
     * @expose
     */
    and(other: Integerable): Integer;
    /**
     * Returns the bitwise OR of this Integer and the specified.
     * @param {!Integer|number|string} other Other Integer
     * @returns {!Integer}
     * @expose
     */
    or(other: Integerable): Integer;
    /**
     * Returns the bitwise XOR of this Integer and the given one.
     * @param {!Integer|number|string} other Other Integer
     * @returns {!Integer}
     * @expose
     */
    xor(other: Integerable): Integer;
    /**
     * Returns this Integer with bits shifted to the left by the given amount.
     * @param {number|!Integer} numBits Number of bits
     * @returns {!Integer} Shifted Integer
     * @expose
     */
    shiftLeft(numBits: number | Integer): Integer;
    /**
     * Returns this Integer with bits arithmetically shifted to the right by the given amount.
     * @param {number|!Integer} numBits Number of bits
     * @returns {!Integer} Shifted Integer
     * @expose
     */
    shiftRight(numBits: number | Integer): Integer;
    /**
     * Signed zero.
     * @type {!Integer}
     * @expose
     */
    static ZERO: Integer;
    /**
     * Signed one.
     * @type {!Integer}
     * @expose
     */
    static ONE: Integer;
    /**
     * Signed negative one.
     * @type {!Integer}
     * @expose
     */
    static NEG_ONE: Integer;
    /**
     * Maximum signed value.
     * @type {!Integer}
     * @expose
     */
    static MAX_VALUE: Integer;
    /**
     * Minimum signed value.
     * @type {!Integer}
     * @expose
     */
    static MIN_VALUE: Integer;
    /**
     * Minimum safe value.
     * @type {!Integer}
     * @expose
     */
    static MIN_SAFE_VALUE: Integer;
    /**
     * Maximum safe value.
     * @type {!Integer}
     * @expose
     */
    static MAX_SAFE_VALUE: Integer;
    /**
     * An indicator used to reliably determine if an object is a Integer or not.
     * @type {boolean}
     * @const
     * @expose
     * @private
     */
    static __isInteger__: boolean;
    /**
     * Tests if the specified object is a Integer.
     * @access private
     * @param {*} obj Object
     * @returns {boolean}
     * @expose
     */
    static isInteger(obj: any): obj is Integer;
    /**
     * Returns a Integer representing the given 32 bit integer value.
     * @access private
     * @param {number} value The 32 bit integer in question
     * @returns {!Integer} The corresponding Integer value
     * @expose
     */
    static fromInt(value: number): Integer;
    /**
     * Returns a Integer representing the 64 bit integer that comes by concatenating the given low and high bits. Each is
     *  assumed to use 32 bits.
     * @access private
     * @param {number} lowBits The low 32 bits
     * @param {number} highBits The high 32 bits
     * @returns {!Integer} The corresponding Integer value
     * @expose
     */
    static fromBits(lowBits: number, highBits: number): Integer;
    /**
     * Returns a Integer representing the given value, provided that it is a finite number. Otherwise, zero is returned.
     * @access private
     * @param {number} value The number in question
     * @returns {!Integer} The corresponding Integer value
     * @expose
     */
    static fromNumber(value: number): Integer;
    /**
     * Returns a Integer representation of the given string, written using the specified radix.
     * @access private
     * @param {string} str The textual representation of the Integer
     * @param {number=} radix The radix in which the text is written (2-36), defaults to 10
     * @param {Object} [opts={}] Configuration options
     * @param {boolean} [opts.strictStringValidation=false] Enable strict validation generated Integer.
     * @returns {!Integer} The corresponding Integer value
     * @expose
     */
    static fromString(str: string, radix?: number, { strictStringValidation }?: {
        strictStringValidation?: boolean;
    }): Integer;
    /**
     * Converts the specified value to a Integer.
     * @access private
     * @param {!Integer|number|string|bigint|!{low: number, high: number}} val Value
     * @param {Object} [opts={}] Configuration options
     * @param {boolean} [opts.strictStringValidation=false] Enable strict validation generated Integer.
     * @param {boolean} [opts.ceilFloat=false] Enable round up float to the nearest Integer.
     * @returns {!Integer}
     * @expose
     */
    static fromValue(val: Integerable, opts?: {
        strictStringValidation?: boolean;
        ceilFloat?: boolean;
    }): Integer;
    /**
     * Converts the specified value to a number.
     * @access private
     * @param {!Integer|number|string|!{low: number, high: number}} val Value
     * @returns {number}
     * @expose
     */
    static toNumber(val: Integerable): number;
    /**
     * Converts the specified value to a string.
     * @access private
     * @param {!Integer|number|string|!{low: number, high: number}} val Value
     * @param {number} radix optional radix for string conversion, defaults to 10
     * @returns {string}
     * @expose
     */
    static toString(val: Integerable, radix?: number): string;
    /**
     * Checks if the given value is in the safe range in order to be converted to a native number
     * @access private
     * @param {!Integer|number|string|!{low: number, high: number}} val Value
     * @param {number} radix optional radix for string conversion, defaults to 10
     * @returns {boolean}
     * @expose
     */
    static inSafeRange(val: Integerable): boolean;
}
type Integerable = number | string | Integer | {
    low: number;
    high: number;
} | bigint;
/**
 * Cast value to Integer type.
 * @access public
 * @param {Mixed} value - The value to use.
 * @param {Object} [opts={}] Configuration options
 * @param {boolean} [opts.strictStringValidation=false] Enable strict validation generated Integer.
 * @param {boolean} [opts.ceilFloat=false] Enable round up float to the nearest Integer.
 * @return {Integer} - An object of type Integer.
 */
declare const int: typeof Integer.fromValue;
/**
 * Check if a variable is of Integer type.
 * @access public
 * @param {Mixed} value - The variable to check.
 * @return {Boolean} - Is it of the Integer type?
 */
declare const isInt: typeof Integer.isInteger;
/**
 * Check if a variable can be safely converted to a number
 * @access public
 * @param {Mixed} value - The variable to check
 * @return {Boolean} - true if it is safe to call toNumber on variable otherwise false
 */
declare const inSafeRange: typeof Integer.inSafeRange;
/**
 * Converts a variable to a number
 * @access public
 * @param {Mixed} value - The variable to convert
 * @return {number} - the variable as a number
 */
declare const toNumber: typeof Integer.toNumber;
/**
 * Converts the integer to a string representation
 * @access public
 * @param {Mixed} value - The variable to convert
 * @param {number} radix - radix to use in string conversion, defaults to 10
 * @return {string} - returns a string representation of the integer
 */
declare const toString: typeof Integer.toString;
export { int, isInt, inSafeRange, toNumber, toString };
export default Integer;
