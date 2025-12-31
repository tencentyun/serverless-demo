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
Object.defineProperty(exports, "__esModule", { value: true });
var neo4j_driver_core_1 = require("neo4j-driver-core");
// eslint-disable-next-line no-unused-vars
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var 
// eslint-disable-next-line no-unused-vars
Logger = neo4j_driver_core_1.internal.logger.Logger;
var SERVICE_UNAVAILABLE = neo4j_driver_core_1.error.SERVICE_UNAVAILABLE;
var DEFAULT_MAX_RETRY_TIME_MS = 30 * 1000; // 30 seconds
var DEFAULT_INITIAL_RETRY_DELAY_MS = 1000; // 1 seconds
var DEFAULT_RETRY_DELAY_MULTIPLIER = 2.0;
var DEFAULT_RETRY_DELAY_JITTER_FACTOR = 0.2;
var RxRetryLogic = /** @class */ (function () {
    /**
     *
     * @param {Object} args
     * @param {Logger} args.logger
     */
    function RxRetryLogic(_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.maxRetryTimeout, maxRetryTimeout = _c === void 0 ? DEFAULT_MAX_RETRY_TIME_MS : _c, _d = _b.initialDelay, initialDelay = _d === void 0 ? DEFAULT_INITIAL_RETRY_DELAY_MS : _d, _e = _b.delayMultiplier, delayMultiplier = _e === void 0 ? DEFAULT_RETRY_DELAY_MULTIPLIER : _e, _f = _b.delayJitter, delayJitter = _f === void 0 ? DEFAULT_RETRY_DELAY_JITTER_FACTOR : _f, _g = _b.logger, logger = _g === void 0 ? null : _g;
        this._maxRetryTimeout = valueOrDefault(maxRetryTimeout, DEFAULT_MAX_RETRY_TIME_MS);
        this._initialDelay = valueOrDefault(initialDelay, DEFAULT_INITIAL_RETRY_DELAY_MS);
        this._delayMultiplier = valueOrDefault(delayMultiplier, DEFAULT_RETRY_DELAY_MULTIPLIER);
        this._delayJitter = valueOrDefault(delayJitter, DEFAULT_RETRY_DELAY_JITTER_FACTOR);
        this._logger = logger;
    }
    /**
     *
     * @param {Observable<Any>} work
     */
    RxRetryLogic.prototype.retry = function (work) {
        var _this = this;
        return work.pipe((0, operators_1.retryWhen)(function (failedWork) {
            var handledExceptions = [];
            var startTime = Date.now();
            var retryCount = 1;
            var delayDuration = _this._initialDelay;
            return failedWork.pipe((0, operators_1.mergeMap)(function (err) {
                if (!(0, neo4j_driver_core_1.isRetriableError)(err)) {
                    return (0, rxjs_1.throwError)(function () { return err; });
                }
                handledExceptions.push(err);
                if (retryCount >= 2 &&
                    Date.now() - startTime >= _this._maxRetryTimeout) {
                    var error_1 = (0, neo4j_driver_core_1.newError)("Failed after retried for ".concat(retryCount, " times in ").concat(_this._maxRetryTimeout, " ms. Make sure that your database is online and retry again."), SERVICE_UNAVAILABLE);
                    error_1.seenErrors = handledExceptions;
                    return (0, rxjs_1.throwError)(function () { return error_1; });
                }
                var nextDelayDuration = _this._computeNextDelay(delayDuration);
                delayDuration = delayDuration * _this._delayMultiplier;
                retryCount++;
                if (_this._logger) {
                    _this._logger.warn("Transaction failed and will be retried in ".concat(nextDelayDuration));
                }
                return (0, rxjs_1.of)(1).pipe((0, operators_1.delay)(nextDelayDuration));
            }));
        }));
    };
    RxRetryLogic.prototype._computeNextDelay = function (delay) {
        var jitter = delay * this._delayJitter;
        return delay - jitter + 2 * jitter * Math.random();
    };
    return RxRetryLogic;
}());
exports.default = RxRetryLogic;
function valueOrDefault(value, defaultValue) {
    if (value || value === 0) {
        return value;
    }
    return defaultValue;
}