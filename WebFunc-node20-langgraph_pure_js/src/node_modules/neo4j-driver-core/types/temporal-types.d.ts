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
import { NumberOrInteger, StandardDate } from './graph-types';
import Integer from './integer';
/**
 * Represents an ISO 8601 duration. Contains both date-based values (years, months, days) and time-based values (seconds, nanoseconds).
 * Created `Duration` objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class Duration<T extends NumberOrInteger = Integer> {
    readonly months: T;
    readonly days: T;
    readonly seconds: T;
    readonly nanoseconds: T;
    /**
     * @constructor
     * @param {NumberOrInteger} months - The number of months for the new duration.
     * @param {NumberOrInteger} days - The number of days for the new duration.
     * @param {NumberOrInteger} seconds - The number of seconds for the new duration.
     * @param {NumberOrInteger} nanoseconds - The number of nanoseconds for the new duration.
     */
    constructor(months: T, days: T, seconds: T, nanoseconds: T);
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link Duration} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Duration}, `false` otherwise.
 */
export declare function isDuration<T extends NumberOrInteger = Integer>(obj: unknown): obj is Duration<T>;
/**
 * Represents an instant capturing the time of day, but not the date, nor the timezone.
 * Created {@link LocalTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class LocalTime<T extends NumberOrInteger = Integer> {
    readonly hour: T;
    readonly minute: T;
    readonly second: T;
    readonly nanosecond: T;
    /**
     * @constructor
     * @param {NumberOrInteger} hour - The hour for the new local time.
     * @param {NumberOrInteger} minute - The minute for the new local time.
     * @param {NumberOrInteger} second - The second for the new local time.
     * @param {NumberOrInteger} nanosecond - The nanosecond for the new local time.
     */
    constructor(hour: T, minute: T, second: T, nanosecond: T);
    /**
     * Create a {@link LocalTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Year, month, day and time zone offset components of the given date are ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {LocalTime<number>} New LocalTime.
     */
    static fromStandardDate(standardDate: StandardDate, nanosecond?: NumberOrInteger): LocalTime<number>;
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link LocalTime} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link LocalTime}, `false` otherwise.
 */
export declare function isLocalTime<T extends NumberOrInteger = Integer>(obj: unknown): obj is LocalTime<T>;
/**
 * Represents an instant capturing the time of day, and the timezone offset in seconds, but not the date.
 * Created {@link Time} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class Time<T extends NumberOrInteger = Integer> {
    readonly hour: T;
    readonly minute: T;
    readonly second: T;
    readonly nanosecond: T;
    readonly timeZoneOffsetSeconds: T;
    /**
     * @constructor
     * @param {NumberOrInteger} hour - The hour for the new local time.
     * @param {NumberOrInteger} minute - The minute for the new local time.
     * @param {NumberOrInteger} second - The second for the new local time.
     * @param {NumberOrInteger} nanosecond - The nanosecond for the new local time.
     * @param {NumberOrInteger} timeZoneOffsetSeconds - The time zone offset in seconds. Value represents the difference, in seconds, from UTC to local time.
     * This is different from standard JavaScript `Date.getTimezoneOffset()` which is the difference, in minutes, from local time to UTC.
     */
    constructor(hour: T, minute: T, second: T, nanosecond: T, timeZoneOffsetSeconds: T);
    /**
     * Create a {@link Time} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Year, month and day components of the given date are ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {Time<number>} New Time.
     */
    static fromStandardDate(standardDate: StandardDate, nanosecond?: NumberOrInteger): Time<number>;
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link Time} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Time}, `false` otherwise.
 */
export declare function isTime<T extends NumberOrInteger = Integer>(obj: unknown): obj is Time<T>;
/**
 * Represents an instant capturing the date, but not the time, nor the timezone.
 * Created {@link Date} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class Date<T extends NumberOrInteger = Integer> {
    readonly year: T;
    readonly month: T;
    readonly day: T;
    /**
     * @constructor
     * @param {NumberOrInteger} year - The year for the new local date.
     * @param {NumberOrInteger} month - The month for the new local date.
     * @param {NumberOrInteger} day - The day for the new local date.
     */
    constructor(year: T, month: T, day: T);
    /**
     * Create a {@link Date} object from the given standard JavaScript `Date`.
     * Hour, minute, second, millisecond and time zone offset components of the given date are ignored.
     *
     * NOTE: the function {@link toStandardDate} and {@link fromStandardDate} are not inverses of one another. {@link fromStandardDate} takes the Day, Month and Year in local time from the supplies JavaScript Date object, while {@link toStandardDate} creates a new JavaScript Date object at midnight UTC. This incongruity will be rectified in 6.0
     * If your timezone has a negative offset from UTC, creating a JavaScript Date at midnight UTC and converting it with {@link fromStandardDate} will result in a Date for the day before.
     *
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @return {Date} New Date.
     */
    static fromStandardDate(standardDate: StandardDate): Date<number>;
    /**
     * Convert date to standard JavaScript `Date`.
     *
     * The time component of the returned `Date` is set to midnight
     * and the time zone is set to UTC.
     *
     * NOTE: the function {@link toStandardDate} and {@link fromStandardDate} are not inverses of one another. {@link fromStandardDate} takes the Day, Month and Year in local time from the supplies JavaScript Date object, while {@link toStandardDate} creates a new JavaScript Date object at midnight UTC. This incongruity will be rectified in 6.0
     *
     * @returns {StandardDate} Standard JavaScript `Date` at `00:00:00.000` UTC.
     */
    toStandardDate(): StandardDate;
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link Date} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link Date}, `false` otherwise.
 */
export declare function isDate<T extends NumberOrInteger = Integer>(obj: unknown): obj is Date<T>;
/**
 * Represents an instant capturing the date and the time, but not the timezone.
 * Created {@link LocalDateTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class LocalDateTime<T extends NumberOrInteger = Integer> {
    readonly year: T;
    readonly month: T;
    readonly day: T;
    readonly hour: T;
    readonly minute: T;
    readonly second: T;
    readonly nanosecond: T;
    /**
     * @constructor
     * @param {NumberOrInteger} year - The year for the new local date.
     * @param {NumberOrInteger} month - The month for the new local date.
     * @param {NumberOrInteger} day - The day for the new local date.
     * @param {NumberOrInteger} hour - The hour for the new local time.
     * @param {NumberOrInteger} minute - The minute for the new local time.
     * @param {NumberOrInteger} second - The second for the new local time.
     * @param {NumberOrInteger} nanosecond - The nanosecond for the new local time.
     */
    constructor(year: T, month: T, day: T, hour: T, minute: T, second: T, nanosecond: T);
    /**
     * Create a {@link LocalDateTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Time zone offset component of the given date is ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {LocalDateTime} New LocalDateTime.
     */
    static fromStandardDate(standardDate: StandardDate, nanosecond?: NumberOrInteger): LocalDateTime<number>;
    /**
     * Convert date to standard JavaScript `Date`.
     *
     * @returns {StandardDate} Standard JavaScript `Date` at the local timezone
     */
    toStandardDate(): StandardDate;
    /**
     * @ignore
     */
    toString(): string;
}
/**
 * Test if given object is an instance of {@link LocalDateTime} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link LocalDateTime}, `false` otherwise.
 */
export declare function isLocalDateTime<T extends NumberOrInteger = Integer>(obj: unknown): obj is LocalDateTime<T>;
/**
 * Represents an instant capturing the date, the time and the timezone identifier.
 * Created {@ DateTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
export declare class DateTime<T extends NumberOrInteger = Integer> {
    readonly year: T;
    readonly month: T;
    readonly day: T;
    readonly hour: T;
    readonly minute: T;
    readonly second: T;
    readonly nanosecond: T;
    readonly timeZoneOffsetSeconds?: T;
    readonly timeZoneId?: string;
    /**
     * @constructor
     * @param {NumberOrInteger} year - The year for the new date-time.
     * @param {NumberOrInteger} month - The month for the new date-time.
     * @param {NumberOrInteger} day - The day for the new date-time.
     * @param {NumberOrInteger} hour - The hour for the new date-time.
     * @param {NumberOrInteger} minute - The minute for the new date-time.
     * @param {NumberOrInteger} second - The second for the new date-time.
     * @param {NumberOrInteger} nanosecond - The nanosecond for the new date-time.
     * @param {NumberOrInteger} timeZoneOffsetSeconds - The time zone offset in seconds. Either this argument or `timeZoneId` should be defined.
     * Value represents the difference, in seconds, from UTC to local time.
     * This is different from standard JavaScript `Date.getTimezoneOffset()` which is the difference, in minutes, from local time to UTC.
     * @param {string|null} timeZoneId - The time zone id for the new date-time. Either this argument or `timeZoneOffsetSeconds` should be defined.
     */
    constructor(year: T, month: T, day: T, hour: T, minute: T, second: T, nanosecond: T, timeZoneOffsetSeconds?: T, timeZoneId?: string | null);
    /**
     * Create a {@link DateTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {DateTime} New DateTime.
     */
    static fromStandardDate(standardDate: StandardDate, nanosecond?: NumberOrInteger): DateTime<number>;
    /**
     * Convert date to standard JavaScript `Date`.
     *
     * @returns {StandardDate} Standard JavaScript `Date` at the defined time zone offset
     * @throws {Error} If the time zone offset is not defined in the object.
     */
    toStandardDate(): StandardDate;
    /**
     * @ignore
     */
    toString(): string;
    /**
     * @private
     * @returns {number}
     */
    private _toUTC;
}
/**
 * Test if given object is an instance of {@link DateTime} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link DateTime}, `false` otherwise.
 */
export declare function isDateTime<T extends NumberOrInteger = Integer>(obj: unknown): obj is DateTime<T>;
