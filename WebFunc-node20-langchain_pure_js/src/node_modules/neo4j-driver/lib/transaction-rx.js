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
var result_rx_1 = __importDefault(require("./result-rx"));
// eslint-disable-next-line no-unused-vars
var neo4j_driver_core_1 = __importDefault(require("neo4j-driver-core"));
/**
 * A reactive transaction, which provides the same functionality as {@link Transaction} but through a Reactive API.
 */
var RxTransaction = /** @class */ (function () {
    /**
     * @constructor
     * @protected
     * @param {Transaction} txc - The underlying transaction instance to relay requests
     */
    function RxTransaction(txc) {
        this._txc = txc;
    }
    /**
     * Creates a reactive result that will execute the query in this transaction, with the provided parameters.
     *
     * @public
     * @param {string} query - Query to be executed.
     * @param {Object} parameters - Parameter values to use in query execution.
     * @returns {RxResult} - A reactive result
     */
    RxTransaction.prototype.run = function (query, parameters) {
        var _this = this;
        return new result_rx_1.default(new rxjs_1.Observable(function (observer) {
            try {
                observer.next(_this._txc.run(query, parameters));
                observer.complete();
            }
            catch (err) {
                observer.error(err);
            }
            return function () { };
        }));
    };
    /**
     *  Commits the transaction.
     *
     * @public
     * @returns {Observable} - An empty observable
     */
    RxTransaction.prototype.commit = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            _this._txc
                .commit()
                .then(function () {
                observer.complete();
            })
                .catch(function (err) { return observer.error(err); });
        });
    };
    /**
     *  Rolls back the transaction.
     *
     * @public
     * @returns {Observable} - An empty observable
     */
    RxTransaction.prototype.rollback = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            _this._txc
                .rollback()
                .then(function () {
                observer.complete();
            })
                .catch(function (err) { return observer.error(err); });
        });
    };
    /**
     * Check if this transaction is active, which means commit and rollback did not happen.
     * @return {boolean} `true` when not committed and not rolled back, `false` otherwise.
     */
    RxTransaction.prototype.isOpen = function () {
        return this._txc.isOpen();
    };
    /**
     * Closes the transaction
     *
     * This method will roll back the transaction if it is not already committed or rolled back.
     *
     * @returns {Observable} - An empty observable
     */
    RxTransaction.prototype.close = function () {
        var _this = this;
        return new rxjs_1.Observable(function (observer) {
            _this._txc
                .close()
                .then(function () {
                observer.complete();
            })
                .catch(function (err) { return observer.error(err); });
        });
    };
    return RxTransaction;
}());
exports.default = RxTransaction;