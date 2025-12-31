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
import Integer from '../integer';
import { NumberOrInteger } from '../graph-types';
declare class ValueRange {
    _minNumber: number;
    _maxNumber: number;
    _minInteger: Integer;
    _maxInteger: Integer;
    constructor(min: number, max: number);
    contains(value: number | Integer | bigint): boolean;
    toString(): string;
}
export declare const YEAR_RANGE: ValueRange;
export declare const MONTH_OF_YEAR_RANGE: ValueRange;
export declare const DAY_OF_MONTH_RANGE: ValueRange;
export declare const HOUR_OF_DAY_RANGE: ValueRange;
export declare const MINUTE_OF_HOUR_RANGE: ValueRange;
export declare const SECOND_OF_MINUTE_RANGE: ValueRange;
export declare const NANOSECOND_OF_SECOND_RANGE: ValueRange;
export declare const MINUTES_PER_HOUR = 60;
export declare const SECONDS_PER_MINUTE = 60;
export declare const SECONDS_PER_HOUR: number;
export declare const NANOS_PER_SECOND = 1000000000;
export declare const NANOS_PER_MILLISECOND = 1000000;
export declare const NANOS_PER_MINUTE: number;
export declare const NANOS_PER_HOUR: number;
export declare const DAYS_0000_TO_1970 = 719528;
export declare const DAYS_PER_400_YEAR_CYCLE = 146097;
export declare const SECONDS_PER_DAY = 86400;
export declare function normalizeSecondsForDuration(seconds: number | Integer | bigint, nanoseconds: number | Integer | bigint): Integer;
export declare function normalizeNanosecondsForDuration(nanoseconds: number | Integer | bigint): Integer;
/**
 * Converts given local time into a single integer representing this same time in nanoseconds of the day.
 * @param {Integer|number|string} hour the hour of the local time to convert.
 * @param {Integer|number|string} minute the minute of the local time to convert.
 * @param {Integer|number|string} second the second of the local time to convert.
 * @param {Integer|number|string} nanosecond the nanosecond of the local time to convert.
 * @return {Integer} nanoseconds representing the given local time.
 */
export declare function localTimeToNanoOfDay(hour: NumberOrInteger | string, minute: NumberOrInteger | string, second: NumberOrInteger | string, nanosecond: NumberOrInteger | string): Integer;
/**
 * Converts given local date time into a single integer representing this same time in epoch seconds UTC.
 * @param {Integer|number|string} year the year of the local date-time to convert.
 * @param {Integer|number|string} month the month of the local date-time to convert.
 * @param {Integer|number|string} day the day of the local date-time to convert.
 * @param {Integer|number|string} hour the hour of the local date-time to convert.
 * @param {Integer|number|string} minute the minute of the local date-time to convert.
 * @param {Integer|number|string} second the second of the local date-time to convert.
 * @param {Integer|number|string} nanosecond the nanosecond of the local date-time to convert.
 * @return {Integer} epoch second in UTC representing the given local date time.
 */
export declare function localDateTimeToEpochSecond(year: NumberOrInteger | string, month: NumberOrInteger | string, day: NumberOrInteger | string, hour: NumberOrInteger | string, minute: NumberOrInteger | string, second: NumberOrInteger | string, nanosecond: NumberOrInteger | string): Integer;
/**
 * Converts given local date into a single integer representing it's epoch day.
 * @param {Integer|number|string} year the year of the local date to convert.
 * @param {Integer|number|string} month the month of the local date to convert.
 * @param {Integer|number|string} day the day of the local date to convert.
 * @return {Integer} epoch day representing the given date.
 */
export declare function dateToEpochDay(year: NumberOrInteger | string, month: NumberOrInteger | string, day: NumberOrInteger | string): Integer;
/**
 * Format given duration to an ISO 8601 string.
 * @param {Integer|number|string} months the number of months.
 * @param {Integer|number|string} days the number of days.
 * @param {Integer|number|string} seconds the number of seconds.
 * @param {Integer|number|string} nanoseconds the number of nanoseconds.
 * @return {string} ISO string that represents given duration.
 */
export declare function durationToIsoString(months: NumberOrInteger | string, days: NumberOrInteger | string, seconds: NumberOrInteger | string, nanoseconds: NumberOrInteger | string): string;
/**
 * Formats given time to an ISO 8601 string.
 * @param {Integer|number|string} hour the hour value.
 * @param {Integer|number|string} minute the minute value.
 * @param {Integer|number|string} second the second value.
 * @param {Integer|number|string} nanosecond the nanosecond value.
 * @return {string} ISO string that represents given time.
 */
export declare function timeToIsoString(hour: NumberOrInteger | string, minute: NumberOrInteger | string, second: NumberOrInteger | string, nanosecond: NumberOrInteger | string): string;
/**
 * Formats given time zone offset in seconds to string representation like '±HH:MM', '±HH:MM:SS' or 'Z' for UTC.
 * @param {Integer|number|string} offsetSeconds the offset in seconds.
 * @return {string} ISO string that represents given offset.
 */
export declare function timeZoneOffsetToIsoString(offsetSeconds: NumberOrInteger | string): string;
/**
 * Formats given date to an ISO 8601 string.
 * @param {Integer|number|string} year the date year.
 * @param {Integer|number|string} month the date month.
 * @param {Integer|number|string} day the date day.
 * @return {string} ISO string that represents given date.
 */
export declare function dateToIsoString(year: NumberOrInteger | string, month: NumberOrInteger | string, day: NumberOrInteger | string): string;
/**
 * Convert the given iso date string to a JavaScript Date object
 *
 * @param {string} isoString The iso date string
 * @returns {Date} the date
 */
export declare function isoStringToStandardDate(isoString: string): Date;
/**
 * Convert the given utc timestamp to a JavaScript Date object
 *
 * @param {number} utc Timestamp in UTC
 * @returns {Date} the date
 */
export declare function toStandardDate(utc: number): Date;
/**
 * Shortcut for creating a new StandardDate
 * @param date
 * @returns {Date} the standard date
 */
export declare function newDate(date: string | number | Date): Date;
/**
 * Get the total number of nanoseconds from the milliseconds of the given standard JavaScript date and optional nanosecond part.
 * @param {global.Date} standardDate the standard JavaScript date.
 * @param {Integer|number|bigint|undefined} nanoseconds the optional number of nanoseconds.
 * @return {Integer|number|bigint} the total amount of nanoseconds.
 */
export declare function totalNanoseconds(standardDate: Date, nanoseconds?: NumberOrInteger): NumberOrInteger;
/**
 * Get the time zone offset in seconds from the given standard JavaScript date.
 *
 * @param {global.Date} standardDate the standard JavaScript date.
 * @return {number} the time zone offset in seconds.
 */
export declare function timeZoneOffsetInSeconds(standardDate: Date): number;
/**
 * Assert that the year value is valid.
 * @param {Integer|number} year the value to check.
 * @return {Integer|number} the value of the year if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidYear(year: NumberOrInteger): NumberOrInteger;
/**
 * Assert that the month value is valid.
 * @param {Integer|number} month the value to check.
 * @return {Integer|number} the value of the month if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidMonth(month: NumberOrInteger): NumberOrInteger;
/**
 * Assert that the day value is valid.
 * @param {Integer|number} day the value to check.
 * @return {Integer|number} the value of the day if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidDay(day: NumberOrInteger): NumberOrInteger;
/**
 * Assert that the hour value is valid.
 * @param {Integer|number} hour the value to check.
 * @return {Integer|number} the value of the hour if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidHour(hour: NumberOrInteger): NumberOrInteger;
/**
 * Assert that the minute value is valid.
 * @param {Integer|number} minute the value to check.
 * @return {Integer|number} the value of the minute if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidMinute(minute: NumberOrInteger): NumberOrInteger;
/**
 * Assert that the second value is valid.
 * @param {Integer|number} second the value to check.
 * @return {Integer|number} the value of the second if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidSecond(second: NumberOrInteger): NumberOrInteger;
/**
 * Assert that the nanosecond value is valid.
 * @param {Integer|number} nanosecond the value to check.
 * @return {Integer|number} the value of the nanosecond if it is valid. Exception is thrown otherwise.
 */
export declare function assertValidNanosecond(nanosecond: NumberOrInteger): NumberOrInteger;
export declare function assertValidZoneId(fieldName: string, zoneId: string): void;
/**
 * @param {Integer|number|string} x the divident.
 * @param {Integer|number|string} y the divisor.
 * @return {Integer} the result.
 */
export declare function floorDiv(x: NumberOrInteger | string, y: NumberOrInteger | string): Integer;
/**
 * @param {Integer|number|string} x the divident.
 * @param {Integer|number|string} y the divisor.
 * @return {Integer} the result.
 */
export declare function floorMod(x: NumberOrInteger | string, y: NumberOrInteger | string): Integer;
export {};
