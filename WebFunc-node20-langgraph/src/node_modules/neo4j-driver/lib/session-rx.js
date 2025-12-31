"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
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
var rxjs_1 = require("rxjs");
var operators_1 = require("rxjs/operators");
var result_rx_1 = __importDefault(require("./result-rx"));
// eslint-disable-next-line no-unused-vars
var neo4j_driver_core_1 = require("neo4j-driver-core");
var transaction_rx_1 = __importDefault(require("./transaction-rx"));
var transaction_managed_rx_1 = __importDefault(require("./transaction-managed-rx"));
var retry_logic_rx_1 = __importDefault(require("./internal/retry-logic-rx"));
var _a = neo4j_driver_core_1.internal.constants, ACCESS_MODE_READ = _a.ACCESS_MODE_READ, ACCESS_MODE_WRITE = _a.ACCESS_MODE_WRITE, TELEMETRY_APIS = _a.TELEMETRY_APIS, TxConfig = neo4j_driver_core_1.internal.txConfig.TxConfig;
/**
 * A Reactive session, which provides the same functionality as {@link Session} but through a Reactive API.
 */
var RxSession = /** @class */ (function () {
    /**
     * Constructs a reactive session with given default session instance and provided driver configuration.
     *
     * @protected
     * @param {Object} param - Object parameter
     * @param {Session} param.session - The underlying session instance to relay requests
     */
    function RxSession(_a) {
        var _b = _a === void 0 ? {} : _a, session = _b.session, config = _b.config, log = _b.log;
        this._session = session;
        this._retryLogic = _createRetryLogic(config);
        this._log = log;
    }
    /**
     * Creates a reactive result that will execute the  query with the provided parameters and the provided
     * transaction configuration that applies to the underlying auto-commit transaction.
     *
     * @public
     * @param {string} query - Query to be executed.
     * @param {Object} parameters - Parameter values to use in query execution.
     * @param {TransactionConfig} transactionConfig - Configuration for the new auto-commit transaction.
     * @returns {RxResult} - A reactive result
     */
    RxSession.prototype.run = function (query, parameters, transactionConfig) {
        var _this = this;
        return new result_rx_1.default(new rxjs_1.Observable(function (observer) {
            try {
                observer.next(_this._session.run(query, parameters, transactionConfig));
                observer.complete();
            }
            catch (err) {
                observer.error(err);
            }
            return function () { };
        }));
    };
    /**
     * Starts a new explicit transaction with the provided transaction configuration.
     *
     * @public
     * @param {TransactionConfig} transactionConfig - Configuration for the new transaction.
     * @returns {Observable<RxTransaction>} - A reactive stream that will generate at most **one** RxTransaction instance.
     */
    RxSession.prototype.beginTransaction = function (transactionConfig) {
        return this._beginTransaction(this._session._mode, transactionConfig, { api: TELEMETRY_APIS.UNMANAGED_TRANSACTION });
    };
    /**
     * Executes the provided unit of work in a {@link READ} reactive transaction which is created with the provided
     * transaction configuration.
     * @public
     * @deprecated This method will be removed in version 6.0. Please, use {@link RxSession#executeRead} instead.
     * @param {function(txc: RxTransaction): Observable} work - A unit of work to be executed.
     * @param {TransactionConfig} transactionConfig - Configuration for the enclosing transaction created by the driver.
     * @returns {Observable} - A reactive stream returned by the unit of work.
     */
    RxSession.prototype.readTransaction = function (work, transactionConfig) {
        return this._runTransaction(ACCESS_MODE_READ, work, transactionConfig);
    };
    /**
     * Executes the provided unit of work in a {@link WRITE} reactive transaction which is created with the provided
     * transaction configuration.
     * @public
     * @deprecated This method will be removed in version 6.0. Please, use {@link RxSession#executeWrite} instead.
     * @param {function(txc: RxTransaction): Observable} work - A unit of work to be executed.
     * @param {TransactionConfig} transactionConfig - Configuration for the enclosing transaction created by the driver.
     * @returns {Observable} - A reactive stream returned by the unit of work.
     */
    RxSession.prototype.writeTransaction = function (work, transactionConfig) {
        return this._runTransaction(ACCESS_MODE_WRITE, work, transactionConfig);
    };
    /**
     * Executes the provided unit of work in a {@link READ} reactive transaction which is created with the provided
     * transaction configuration.
     * @public
     * @param {function(txc: RxManagedTransaction): Observable} work - A unit of work to be executed.
     * @param {TransactionConfig} transactionConfig - Configuration for the enclosing transaction created by the driver.
     * @returns {Observable} - A reactive stream returned by the unit of work.
     */
    RxSession.prototype.executeRead = function (work, transactionConfig) {
        return this._executeInTransaction(ACCESS_MODE_READ, work, transactionConfig);
    };
    /**
     * Executes the provided unit of work in a {@link WRITE} reactive transaction which is created with the provided
     * transaction configuration.
     * @public
     * @param {function(txc: RxManagedTransaction): Observable} work - A unit of work to be executed.
     * @param {TransactionConfig} transactionConfig - Configuration for the enclosing transaction created by the driver.
     * @returns {Observable} - A reactive stream returned by the unit of work.
     */
    RxSession.prototype.executeWrite = function (work, transactionConfig) {
        return this._executeInTransaction(ACCESS_MODE_WRITE, work, transactionConfig);
    };
    /**
     * @private
     * @param {function(txc: RxManagedTransaction): Observable} work
     * @param {TransactionConfig} transactionConfig
     * @returns {Observable}
     */
    RxSession.prototype._executeInTransaction = function (accessMode, work, transactionConfig) {
        var wrapper = function (txc) { return new transaction_managed_rx_1.default({
            run: txc.run.bind(txc)
        }); };
        return this._runTransaction(accessMode, work, transactionConfig, wrapper);
    };
    /**
     * Closes this reactive session.
     *
     * @public
     * @returns {Observable} - An empty reactive stream
     */
    RxSession.prototype.close = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            _this._session
                .close()
                .then(function () {
                observer.complete();
            })
                .catch(function (err) { return observer.error(err); });
        });
    };
    RxSession.prototype[Symbol.asyncDispose] = function () {
        return this.close();
    };
    /**
     * Returns the bookmarks received following the last successfully completed query, which is executed
     * either in an {@link RxTransaction} obtained from this session instance or directly through one of
     * the {@link RxSession#run} method of this session instance.
     *
     * If no bookmarks were received or if this transaction was rolled back, the bookmarks value will not be
     * changed.
     *
     * @deprecated This method will be removed in 6.0 version. Please, use {@link RxSession#lastBookmarks} instead.
     *
     * @public
     * @returns {string[]}
     */
    RxSession.prototype.lastBookmark = function () {
        return this.lastBookmarks();
    };
    /**
     * Returns the bookmarks received following the last successfully completed query, which is executed
     * either in an {@link RxTransaction} obtained from this session instance or directly through one of
     * the {@link RxSession#run} method of this session instance.
     *
     * If no bookmarks were received or if this transaction was rolled back, the bookmarks value will not be
     * changed.
     *
     * @public
     * @returns {string[]}
     */
    RxSession.prototype.lastBookmarks = function () {
        return this._session.lastBookmarks();
    };
    /**
     * @private
     */
    RxSession.prototype._beginTransaction = function (accessMode, transactionConfig, apiTelemetryConfig) {
        var _this = this;
        var txConfig = TxConfig.empty();
        if (transactionConfig) {
            txConfig = new TxConfig(transactionConfig, this._log);
        }
        return new rxjs_1.Observable(function (observer) {
            try {
                _this._session._beginTransaction(accessMode, txConfig, apiTelemetryConfig)
                    .then(function (tx) {
                    observer.next(new transaction_rx_1.default(tx));
                    observer.complete();
                })
                    .catch(function (err) { return observer.error(err); });
            }
            catch (err) {
                observer.error(err);
            }
            return function () { };
        });
    };
    /**
     * @private
     */
    RxSession.prototype._runTransaction = function (accessMode, work, transactionConfig, transactionWrapper) {
        var _this = this;
        if (transactionWrapper === void 0) { transactionWrapper = function (tx) { return tx; }; }
        var txConfig = TxConfig.empty();
        if (transactionConfig) {
            txConfig = new TxConfig(transactionConfig);
        }
        var context = {
            apiTelemetryConfig: {
                api: TELEMETRY_APIS.MANAGED_TRANSACTION,
                onTelemetrySuccess: function () {
                    context.apiTelemetryConfig = undefined;
                }
            }
        };
        return this._retryLogic.retry((0, rxjs_1.of)(1).pipe((0, operators_1.mergeMap)(function () { return _this._beginTransaction(accessMode, txConfig, context.apiTelemetryConfig); }), (0, operators_1.mergeMap)(function (txc) {
            return (0, rxjs_1.defer)(function () {
                try {
                    return work(transactionWrapper(txc));
                }
                catch (err) {
                    return (0, rxjs_1.throwError)(function () { return err; });
                }
            }).pipe((0, operators_1.catchError)(function (err) { return txc.rollback().pipe((0, operators_1.concatWith)((0, rxjs_1.throwError)(function () { return err; }))); }), (0, operators_1.concatWith)(txc.commit()));
        })));
    };
    return RxSession;
}());
exports.default = RxSession;
function _createRetryLogic(config) {
    var maxRetryTimeout = config && config.maxTransactionRetryTime
        ? config.maxTransactionRetryTime
        : null;
    return new retry_logic_rx_1.default({ maxRetryTimeout: maxRetryTimeout });
}