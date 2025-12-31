"use strict";
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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDateTime = exports.DateTime = exports.isLocalDateTime = exports.LocalDateTime = exports.isDate = exports.Date = exports.isTime = exports.Time = exports.isLocalTime = exports.LocalTime = exports.isDuration = exports.Duration = void 0;
var util = __importStar(require("./internal/temporal-util"));
var util_1 = require("./internal/util");
var error_1 = require("./error");
var integer_1 = __importStar(require("./integer"));
var IDENTIFIER_PROPERTY_ATTRIBUTES = {
    value: true,
    enumerable: false,
    configurable: false,
    writable: false
};
var DURATION_IDENTIFIER_PROPERTY = '__isDuration__';
var LOCAL_TIME_IDENTIFIER_PROPERTY = '__isLocalTime__';
var TIME_IDENTIFIER_PROPERTY = '__isTime__';
var DATE_IDENTIFIER_PROPERTY = '__isDate__';
var LOCAL_DATE_TIME_IDENTIFIER_PROPERTY = '__isLocalDateTime__';
var DATE_TIME_IDENTIFIER_PROPERTY = '__isDateTime__';
/**
 * Represents an ISO 8601 duration. Contains both date-based values (years, months, days) and time-based values (seconds, nanoseconds).
 * Created `Duration` objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
var Duration = /** @class */ (function () {
    /**
     * @constructor
     * @param {NumberOrInteger} months - The number of months for the new duration.
     * @param {NumberOrInteger} days - The number of days for the new duration.
     * @param {NumberOrInteger} seconds - The number of seconds for the new duration.
     * @param {NumberOrInteger} nanoseconds - The number of nanoseconds for the new duration.
     */
    function Duration(months, days, seconds, nanoseconds) {
        /**
         * The number of months.
         * @type {NumberOrInteger}
         */
        this.months = (0, util_1.assertNumberOrInteger)(months, 'Months');
        /**
         * The number of days.
         * @type {NumberOrInteger}
         */
        this.days = (0, util_1.assertNumberOrInteger)(days, 'Days');
        (0, util_1.assertNumberOrInteger)(seconds, 'Seconds');
        (0, util_1.assertNumberOrInteger)(nanoseconds, 'Nanoseconds');
        /**
         * The number of seconds.
         * @type {NumberOrInteger}
         */
        this.seconds = util.normalizeSecondsForDuration(seconds, nanoseconds);
        /**
         * The number of nanoseconds.
         * @type {NumberOrInteger}
         */
        this.nanoseconds = util.normalizeNanosecondsForDuration(nanoseconds);
        Object.freeze(this);
    }
    /**
     * @ignore
     */
    Duration.prototype.toString = function () {
        return util.durationToIsoString(this.months, this.days, this.seconds, this.nanoseconds);
    };
    return Duration;
}());
exports.Duration = Duration;
Object.defineProperty(Duration.prototype, DURATION_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link Duration} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Duration}, `false` otherwise.
 */
function isDuration(obj) {
    return hasIdentifierProperty(obj, DURATION_IDENTIFIER_PROPERTY);
}
exports.isDuration = isDuration;
/**
 * Represents an instant capturing the time of day, but not the date, nor the timezone.
 * Created {@link LocalTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
var LocalTime = /** @class */ (function () {
    /**
     * @constructor
     * @param {NumberOrInteger} hour - The hour for the new local time.
     * @param {NumberOrInteger} minute - The minute for the new local time.
     * @param {NumberOrInteger} second - The second for the new local time.
     * @param {NumberOrInteger} nanosecond - The nanosecond for the new local time.
     */
    function LocalTime(hour, minute, second, nanosecond) {
        /**
         * The hour.
         * @type {NumberOrInteger}
         */
        this.hour = util.assertValidHour(hour);
        /**
         * The minute.
         * @type {NumberOrInteger}
         */
        this.minute = util.assertValidMinute(minute);
        /**
         * The second.
         * @type {NumberOrInteger}
         */
        this.second = util.assertValidSecond(second);
        /**
         * The nanosecond.
         * @type {NumberOrInteger}
         */
        this.nanosecond = util.assertValidNanosecond(nanosecond);
        Object.freeze(this);
    }
    /**
     * Create a {@link LocalTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Year, month, day and time zone offset components of the given date are ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {LocalTime<number>} New LocalTime.
     */
    LocalTime.fromStandardDate = function (standardDate, nanosecond) {
        verifyStandardDateAndNanos(standardDate, nanosecond);
        var totalNanoseconds = util.totalNanoseconds(standardDate, nanosecond);
        return new LocalTime(standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), totalNanoseconds instanceof integer_1.default
            ? totalNanoseconds.toInt()
            : typeof totalNanoseconds === 'bigint'
                ? (0, integer_1.int)(totalNanoseconds).toInt()
                : totalNanoseconds);
    };
    /**
     * @ignore
     */
    LocalTime.prototype.toString = function () {
        return util.timeToIsoString(this.hour, this.minute, this.second, this.nanosecond);
    };
    return LocalTime;
}());
exports.LocalTime = LocalTime;
Object.defineProperty(LocalTime.prototype, LOCAL_TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link LocalTime} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link LocalTime}, `false` otherwise.
 */
function isLocalTime(obj) {
    return hasIdentifierProperty(obj, LOCAL_TIME_IDENTIFIER_PROPERTY);
}
exports.isLocalTime = isLocalTime;
/**
 * Represents an instant capturing the time of day, and the timezone offset in seconds, but not the date.
 * Created {@link Time} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
var Time = /** @class */ (function () {
    /**
     * @constructor
     * @param {NumberOrInteger} hour - The hour for the new local time.
     * @param {NumberOrInteger} minute - The minute for the new local time.
     * @param {NumberOrInteger} second - The second for the new local time.
     * @param {NumberOrInteger} nanosecond - The nanosecond for the new local time.
     * @param {NumberOrInteger} timeZoneOffsetSeconds - The time zone offset in seconds. Value represents the difference, in seconds, from UTC to local time.
     * This is different from standard JavaScript `Date.getTimezoneOffset()` which is the difference, in minutes, from local time to UTC.
     */
    function Time(hour, minute, second, nanosecond, timeZoneOffsetSeconds) {
        /**
         * The hour.
         * @type {NumberOrInteger}
         */
        this.hour = util.assertValidHour(hour);
        /**
         * The minute.
         * @type {NumberOrInteger}
         */
        this.minute = util.assertValidMinute(minute);
        /**
         * The second.
         * @type {NumberOrInteger}
         */
        this.second = util.assertValidSecond(second);
        /**
         * The nanosecond.
         * @type {NumberOrInteger}
         */
        this.nanosecond = util.assertValidNanosecond(nanosecond);
        /**
         * The time zone offset in seconds.
         * @type {NumberOrInteger}
         */
        this.timeZoneOffsetSeconds = (0, util_1.assertNumberOrInteger)(timeZoneOffsetSeconds, 'Time zone offset in seconds');
        Object.freeze(this);
    }
    /**
     * Create a {@link Time} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Year, month and day components of the given date are ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {Time<number>} New Time.
     */
    Time.fromStandardDate = function (standardDate, nanosecond) {
        verifyStandardDateAndNanos(standardDate, nanosecond);
        return new Time(standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), (0, integer_1.toNumber)(util.totalNanoseconds(standardDate, nanosecond)), util.timeZoneOffsetInSeconds(standardDate));
    };
    /**
     * @ignore
     */
    Time.prototype.toString = function () {
        return (util.timeToIsoString(this.hour, this.minute, this.second, this.nanosecond) + util.timeZoneOffsetToIsoString(this.timeZoneOffsetSeconds));
    };
    return Time;
}());
exports.Time = Time;
Object.defineProperty(Time.prototype, TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link Time} class.
 * @param {Object} obj the object to test.
 * @return {boolean} `true` if given object is a {@link Time}, `false` otherwise.
 */
function isTime(obj) {
    return hasIdentifierProperty(obj, TIME_IDENTIFIER_PROPERTY);
}
exports.isTime = isTime;
/**
 * Represents an instant capturing the date, but not the time, nor the timezone.
 * Created {@link Date} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
var Date = /** @class */ (function () {
    /**
     * @constructor
     * @param {NumberOrInteger} year - The year for the new local date.
     * @param {NumberOrInteger} month - The month for the new local date.
     * @param {NumberOrInteger} day - The day for the new local date.
     */
    function Date(year, month, day) {
        /**
         * The year.
         * @type {NumberOrInteger}
         */
        this.year = util.assertValidYear(year);
        /**
         * The month.
         * @type {NumberOrInteger}
         */
        this.month = util.assertValidMonth(month);
        /**
         * The day.
         * @type {NumberOrInteger}
         */
        this.day = util.assertValidDay(day);
        Object.freeze(this);
    }
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
    Date.fromStandardDate = function (standardDate) {
        verifyStandardDateAndNanos(standardDate);
        return new Date(standardDate.getFullYear(), standardDate.getMonth() + 1, standardDate.getDate());
    };
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
    Date.prototype.toStandardDate = function () {
        return util.isoStringToStandardDate(this.toString());
    };
    /**
     * @ignore
     */
    Date.prototype.toString = function () {
        return util.dateToIsoString(this.year, this.month, this.day);
    };
    return Date;
}());
exports.Date = Date;
Object.defineProperty(Date.prototype, DATE_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link Date} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link Date}, `false` otherwise.
 */
function isDate(obj) {
    return hasIdentifierProperty(obj, DATE_IDENTIFIER_PROPERTY);
}
exports.isDate = isDate;
/**
 * Represents an instant capturing the date and the time, but not the timezone.
 * Created {@link LocalDateTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
var LocalDateTime = /** @class */ (function () {
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
    function LocalDateTime(year, month, day, hour, minute, second, nanosecond) {
        /**
         * The year.
         * @type {NumberOrInteger}
         */
        this.year = util.assertValidYear(year);
        /**
         * The month.
         * @type {NumberOrInteger}
         */
        this.month = util.assertValidMonth(month);
        /**
         * The day.
         * @type {NumberOrInteger}
         */
        this.day = util.assertValidDay(day);
        /**
         * The hour.
         * @type {NumberOrInteger}
         */
        this.hour = util.assertValidHour(hour);
        /**
         * The minute.
         * @type {NumberOrInteger}
         */
        this.minute = util.assertValidMinute(minute);
        /**
         * The second.
         * @type {NumberOrInteger}
         */
        this.second = util.assertValidSecond(second);
        /**
         * The nanosecond.
         * @type {NumberOrInteger}
         */
        this.nanosecond = util.assertValidNanosecond(nanosecond);
        Object.freeze(this);
    }
    /**
     * Create a {@link LocalDateTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * Time zone offset component of the given date is ignored.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {LocalDateTime} New LocalDateTime.
     */
    LocalDateTime.fromStandardDate = function (standardDate, nanosecond) {
        verifyStandardDateAndNanos(standardDate, nanosecond);
        return new LocalDateTime(standardDate.getFullYear(), standardDate.getMonth() + 1, standardDate.getDate(), standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), (0, integer_1.toNumber)(util.totalNanoseconds(standardDate, nanosecond)));
    };
    /**
     * Convert date to standard JavaScript `Date`.
     *
     * @returns {StandardDate} Standard JavaScript `Date` at the local timezone
     */
    LocalDateTime.prototype.toStandardDate = function () {
        return util.isoStringToStandardDate(this.toString());
    };
    /**
     * @ignore
     */
    LocalDateTime.prototype.toString = function () {
        return localDateTimeToString(this.year, this.month, this.day, this.hour, this.minute, this.second, this.nanosecond);
    };
    return LocalDateTime;
}());
exports.LocalDateTime = LocalDateTime;
Object.defineProperty(LocalDateTime.prototype, LOCAL_DATE_TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link LocalDateTime} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link LocalDateTime}, `false` otherwise.
 */
function isLocalDateTime(obj) {
    return hasIdentifierProperty(obj, LOCAL_DATE_TIME_IDENTIFIER_PROPERTY);
}
exports.isLocalDateTime = isLocalDateTime;
/**
 * Represents an instant capturing the date, the time and the timezone identifier.
 * Created {@ DateTime} objects are frozen with `Object.freeze()` in constructor and thus immutable.
 */
var DateTime = /** @class */ (function () {
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
    function DateTime(year, month, day, hour, minute, second, nanosecond, timeZoneOffsetSeconds, timeZoneId) {
        /**
         * The year.
         * @type {NumberOrInteger}
         */
        this.year = util.assertValidYear(year);
        /**
         * The month.
         * @type {NumberOrInteger}
         */
        this.month = util.assertValidMonth(month);
        /**
         * The day.
         * @type {NumberOrInteger}
         */
        this.day = util.assertValidDay(day);
        /**
         * The hour.
         * @type {NumberOrInteger}
         */
        this.hour = util.assertValidHour(hour);
        /**
         * The minute.
         * @type {NumberOrInteger}
         */
        this.minute = util.assertValidMinute(minute);
        /**
         * The second.
         * @type {NumberOrInteger}
         */
        this.second = util.assertValidSecond(second);
        /**
         * The nanosecond.
         * @type {NumberOrInteger}
         */
        this.nanosecond = util.assertValidNanosecond(nanosecond);
        var _a = __read(verifyTimeZoneArguments(timeZoneOffsetSeconds, timeZoneId), 2), offset = _a[0], id = _a[1];
        /**
         * The time zone offset in seconds.
         *
         * *Either this or {@link timeZoneId} is defined.*
         *
         * @type {NumberOrInteger}
         */
        this.timeZoneOffsetSeconds = offset;
        /**
         * The time zone id.
         *
         * *Either this or {@link timeZoneOffsetSeconds} is defined.*
         *
         * @type {string}
         */
        this.timeZoneId = id !== null && id !== void 0 ? id : undefined;
        Object.freeze(this);
    }
    /**
     * Create a {@link DateTime} object from the given standard JavaScript `Date` and optional nanoseconds.
     * @param {global.Date} standardDate - The standard JavaScript date to convert.
     * @param {NumberOrInteger|undefined} nanosecond - The optional amount of nanoseconds.
     * @return {DateTime} New DateTime.
     */
    DateTime.fromStandardDate = function (standardDate, nanosecond) {
        verifyStandardDateAndNanos(standardDate, nanosecond);
        return new DateTime(standardDate.getFullYear(), standardDate.getMonth() + 1, standardDate.getDate(), standardDate.getHours(), standardDate.getMinutes(), standardDate.getSeconds(), (0, integer_1.toNumber)(util.totalNanoseconds(standardDate, nanosecond)), util.timeZoneOffsetInSeconds(standardDate), null /* no time zone id */);
    };
    /**
     * Convert date to standard JavaScript `Date`.
     *
     * @returns {StandardDate} Standard JavaScript `Date` at the defined time zone offset
     * @throws {Error} If the time zone offset is not defined in the object.
     */
    DateTime.prototype.toStandardDate = function () {
        return util.toStandardDate(this._toUTC());
    };
    /**
     * @ignore
     */
    DateTime.prototype.toString = function () {
        var _a;
        var localDateTimeStr = localDateTimeToString(this.year, this.month, this.day, this.hour, this.minute, this.second, this.nanosecond);
        var timeOffset = this.timeZoneOffsetSeconds != null
            ? util.timeZoneOffsetToIsoString((_a = this.timeZoneOffsetSeconds) !== null && _a !== void 0 ? _a : 0)
            : '';
        var timeZoneStr = this.timeZoneId != null
            ? "[".concat(this.timeZoneId, "]")
            : '';
        return localDateTimeStr + timeOffset + timeZoneStr;
    };
    /**
     * @private
     * @returns {number}
     */
    DateTime.prototype._toUTC = function () {
        var _a;
        if (this.timeZoneOffsetSeconds === undefined) {
            throw new Error('Requires DateTime created with time zone offset');
        }
        var epochSecond = util.localDateTimeToEpochSecond(this.year, this.month, this.day, this.hour, this.minute, this.second, this.nanosecond);
        var utcSecond = epochSecond.subtract((_a = this.timeZoneOffsetSeconds) !== null && _a !== void 0 ? _a : 0);
        return (0, integer_1.int)(utcSecond)
            .multiply(1000)
            .add((0, integer_1.int)(this.nanosecond).div(1000000))
            .toNumber();
    };
    return DateTime;
}());
exports.DateTime = DateTime;
Object.defineProperty(DateTime.prototype, DATE_TIME_IDENTIFIER_PROPERTY, IDENTIFIER_PROPERTY_ATTRIBUTES);
/**
 * Test if given object is an instance of {@link DateTime} class.
 * @param {Object} obj - The object to test.
 * @return {boolean} `true` if given object is a {@link DateTime}, `false` otherwise.
 */
function isDateTime(obj) {
    return hasIdentifierProperty(obj, DATE_TIME_IDENTIFIER_PROPERTY);
}
exports.isDateTime = isDateTime;
function hasIdentifierProperty(obj, property) {
    return obj != null && obj[property] === true;
}
function localDateTimeToString(year, month, day, hour, minute, second, nanosecond) {
    return (util.dateToIsoString(year, month, day) +
        'T' +
        util.timeToIsoString(hour, minute, second, nanosecond));
}
/**
 * @private
 * @param {NumberOrInteger} timeZoneOffsetSeconds
 * @param {string | null } timeZoneId
 * @returns {Array<NumberOrInteger | undefined | null, string | undefined | null>}
 */
function verifyTimeZoneArguments(timeZoneOffsetSeconds, timeZoneId) {
    var offsetDefined = timeZoneOffsetSeconds !== null && timeZoneOffsetSeconds !== undefined;
    var idDefined = timeZoneId !== null && timeZoneId !== undefined && timeZoneId !== '';
    if (!offsetDefined && !idDefined) {
        throw (0, error_1.newError)(
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        "Unable to create DateTime without either time zone offset or id. Please specify either of them. Given offset: ".concat(timeZoneOffsetSeconds, " and id: ").concat(timeZoneId));
    }
    var result = [undefined, undefined];
    if (offsetDefined) {
        (0, util_1.assertNumberOrInteger)(timeZoneOffsetSeconds, 'Time zone offset in seconds');
        result[0] = timeZoneOffsetSeconds;
    }
    if (idDefined) {
        (0, util_1.assertString)(timeZoneId, 'Time zone ID');
        util.assertValidZoneId('Time zone ID', timeZoneId);
        result[1] = timeZoneId;
    }
    return result;
}
/**
 * @private
 * @param {StandardDate} standardDate
 * @param {NumberOrInteger} nanosecond
 * @returns {void}
 */
function verifyStandardDateAndNanos(standardDate, nanosecond) {
    (0, util_1.assertValidDate)(standardDate, 'Standard date');
    if (nanosecond !== null && nanosecond !== undefined) {
        (0, util_1.assertNumberOrInteger)(nanosecond, 'Nanosecond');
    }
}
