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
// eslint-disable-next-line no-unused-vars
var result_rx_1 = __importDefault(require("./result-rx"));
// eslint-disable-next-line no-unused-vars
var transaction_rx_1 = __importDefault(require("./transaction-rx"));
/**
 * Represents a rx transaction that is managed by the transaction executor.
 *
 * @public
 */
var RxManagedTransaction = /** @class */ (function () {
    /**
     * @private
     */
    function RxManagedTransaction(_a) {
        var run = _a.run;
        this._run = run;
    }
    /**
     * @private
     * @param {RxTransaction} txc - The transaction to be wrapped
     * @returns {RxManagedTransaction} The managed transaction
     */
    RxManagedTransaction.fromTransaction = function (txc) {
        return new RxManagedTransaction({
            run: txc.run.bind(txc)
        });
    };
    /**
     * Creates a reactive result that will execute the query in this transaction, with the provided parameters.
     *
     * @public
     * @param {string} query - Query to be executed.
     * @param {Object} parameters - Parameter values to use in query execution.
     * @returns {RxResult} - A reactive result
     */
    RxManagedTransaction.prototype.run = function (query, parameters) {
        return this._run(query, parameters);
    };
    return RxManagedTransaction;
}());
exports.default = RxManagedTransaction;