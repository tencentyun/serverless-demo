"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
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
/* eslint-disable-next-line no-unused-vars */
var neo4j_driver_core_1 = require("neo4j-driver-core");
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var States = {
    READY: 0,
    STREAMING: 1,
    COMPLETED: 2
};
/**
 * The reactive result interface.
 */
var RxResult = /** @class */ (function () {
    /**
     * @constructor
     * @protected
     * @param {Observable<Result>} result - An observable of single Result instance to relay requests.
     * @param {number} state - The streaming state
     */
    function RxResult(result, state) {
        var replayedResult = result.pipe((0, operators_1.publishReplay)(1), (0, operators_1.refCount)());
        this._result = replayedResult;
        this._keys = replayedResult.pipe((0, operators_1.mergeMap)(function (r) { return (0, rxjs_1.from)(r.keys()); }), (0, operators_1.publishReplay)(1), (0, operators_1.refCount)());
        this._records = undefined;
        this._controls = new StreamControl();
        this._summary = new rxjs_1.ReplaySubject();
        this._state = state || States.READY;
    }
    /**
     * Returns an observable that exposes a single item containing field names
     * returned by the executing query.
     *
     * Errors raised by actual query execution can surface on the returned
     * observable stream.
     *
     * @public
     * @returns {Observable<string[]>} - An observable stream (with exactly one element) of field names.
     */
    RxResult.prototype.keys = function () {
        return this._keys;
    };
    /**
     * Returns an observable that exposes each record returned by the executing query.
     *
     * Errors raised during the streaming phase can surface on the returned observable stream.
     *
     * @public
     * @returns {Observable<Record>} - An observable stream of records.
     */
    RxResult.prototype.records = function () {
        var _this = this;
        var result = this._result.pipe((0, operators_1.mergeMap)(function (result) {
            return new rxjs_1.Observable(function (recordsObserver) {
                return _this._startStreaming({ result: result, recordsObserver: recordsObserver });
            });
        }));
        result.push = function () { return _this._push(); };
        return result;
    };
    /**
     * Returns an observable that exposes a single item of {@link ResultSummary} that is generated by
     * the server after the streaming of the executing query is completed.
     *
     * *Subscribing to this stream before subscribing to records() stream causes the results to be discarded on the server.*
     *
     * @public
     * @returns {Observable<ResultSummary>} - An observable stream (with exactly one element) of result summary.
     */
    RxResult.prototype.consume = function () {
        var _this = this;
        return this._result.pipe((0, operators_1.mergeMap)(function (result) {
            return new rxjs_1.Observable(function (summaryObserver) {
                return _this._startStreaming({ result: result, summaryObserver: summaryObserver });
            });
        }));
    };
    /**
     * Pauses the automatic streaming of records.
     *
     * This method provides a way of control the flow of records
     *
     * @experimental
     */
    RxResult.prototype.pause = function () {
        this._controls.pause();
    };
    /**
     * Resumes the automatic streaming of records.
     *
     * This method won't need to be called in normal stream operation. It only applies to the case when the stream is paused.
     *
     * This method is method won't start the consuming records if the {@link records} stream didn't get subscribed.
     * @experimental
     * @returns {Promise<void>} - A promise that resolves when the stream is resumed.
     */
    RxResult.prototype.resume = function () {
        return this._controls.resume();
    };
    /**
     * Pushes the next record to the stream.
     *
     * This method automatic pause the auto-streaming of records and then push next record to the stream.
     *
     * For returning the automatic streaming of records, use {@link resume} method.
     *
     * @experimental
     * @returns {Promise<void>} - A promise that resolves when the push is completed.
     */
    RxResult.prototype.push = function () {
        return this._controls.push();
    };
    RxResult.prototype._startStreaming = function (_a) {
        var _b = _a === void 0 ? {} : _a, result = _b.result, _c = _b.recordsObserver, recordsObserver = _c === void 0 ? null : _c, _d = _b.summaryObserver, summaryObserver = _d === void 0 ? null : _d;
        var subscriptions = [];
        if (summaryObserver) {
            subscriptions.push(this._summary.subscribe(summaryObserver));
        }
        if (this._state < States.STREAMING) {
            this._state = States.STREAMING;
            this._setupRecordsStream(result);
            if (recordsObserver) {
                subscriptions.push(this._records.subscribe(recordsObserver));
            }
            else {
                result._cancel();
            }
            subscriptions.push({
                unsubscribe: function () {
                    if (result._cancel) {
                        result._cancel();
                    }
                }
            });
        }
        else if (recordsObserver) {
            recordsObserver.error((0, neo4j_driver_core_1.newError)('Streaming has already started/consumed with a previous records or summary subscription.'));
        }
        return function () {
            subscriptions.forEach(function (s) { return s.unsubscribe(); });
        };
    };
    /**
     * Create a {@link Observable} for the current {@link RxResult}
     *
     *
     * @package
     * @experimental
     * @since 5.0
     * @return {Observable<RxResult>}
     */
    RxResult.prototype._toObservable = function () {
        var _this = this;
        function wrap(result) {
            return new rxjs_1.Observable(function (observer) {
                observer.next(result);
                observer.complete();
            });
        }
        return new rxjs_1.Observable(function (observer) {
            _this._result.subscribe({
                complete: function () { return observer.complete(); },
                next: function (result) { return observer.next(new RxResult(wrap(result)), _this._state); },
                error: function (e) { return observer.error(e); }
            });
        });
    };
    RxResult.prototype._setupRecordsStream = function (result) {
        var _this = this;
        if (this._records) {
            return this._records;
        }
        this._records = createFullyControlledSubject(result[Symbol.asyncIterator](), {
            complete: function () { return __awaiter(_this, void 0, void 0, function () {
                var _a, _b;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            this._state = States.COMPLETED;
                            _b = (_a = this._summary).next;
                            return [4 /*yield*/, result.summary()];
                        case 1:
                            _b.apply(_a, [_c.sent()]);
                            this._summary.complete();
                            return [2 /*return*/];
                    }
                });
            }); },
            error: function (error) {
                _this._state = States.COMPLETED;
                _this._summary.error(error);
            }
        }, this._controls);
        return this._records;
    };
    return RxResult;
}());
exports.default = RxResult;
function createFullyControlledSubject(iterator, completeObserver, streamControl) {
    var _this = this;
    if (streamControl === void 0) { streamControl = new StreamControl(); }
    var subject = new rxjs_1.Subject();
    var pushNextValue = function (result) { return __awaiter(_this, void 0, void 0, function () {
        var _a, done, value, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, 3, 4]);
                    streamControl.pushing = true;
                    return [4 /*yield*/, result];
                case 1:
                    _a = _b.sent(), done = _a.done, value = _a.value;
                    if (done) {
                        subject.complete();
                        completeObserver.complete();
                    }
                    else {
                        subject.next(value);
                        if (!streamControl.paused) {
                            pushNextValue(iterator.next())
                                .catch(function () { });
                        }
                    }
                    return [3 /*break*/, 4];
                case 2:
                    error_1 = _b.sent();
                    subject.error(error_1);
                    completeObserver.error(error_1);
                    return [3 /*break*/, 4];
                case 3:
                    streamControl.pushing = false;
                    return [7 /*endfinally*/];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    function push(value) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, pushNextValue(iterator.next(value))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    streamControl.pusher = push;
    push();
    return subject;
}
var StreamControl = /** @class */ (function () {
    function StreamControl(push) {
        if (push === void 0) { push = function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); }); }; }
        var _this = this;
        this._paused = false;
        this._pushing = false;
        this._push = push;
    }
    StreamControl.prototype.pause = function () {
        this._paused = true;
    };
    Object.defineProperty(StreamControl.prototype, "paused", {
        get: function () {
            return this._paused;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(StreamControl.prototype, "pushing", {
        get: function () {
            return this._pushing;
        },
        set: function (pushing) {
            this._pushing = pushing;
        },
        enumerable: false,
        configurable: true
    });
    StreamControl.prototype.resume = function () {
        return __awaiter(this, void 0, void 0, function () {
            var wasPaused;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        wasPaused = this._paused;
                        this._paused = false;
                        if (!(wasPaused && !this._pushing)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this._push()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    StreamControl.prototype.push = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.pause();
                        return [4 /*yield*/, this._push()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Object.defineProperty(StreamControl.prototype, "pusher", {
        get: function () {
            return this._push;
        },
        set: function (push) {
            this._push = push;
        },
        enumerable: false,
        configurable: true
    });
    return StreamControl;
}());