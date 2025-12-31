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
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WRITE = exports.READ = exports.Driver = void 0;
var neo4j_driver_core_1 = require("neo4j-driver-core");
var session_rx_1 = __importDefault(require("./session-rx"));
var FETCH_ALL = neo4j_driver_core_1.internal.constants.FETCH_ALL;
var READ = neo4j_driver_core_1.driver.READ, WRITE = neo4j_driver_core_1.driver.WRITE;
exports.READ = READ;
exports.WRITE = WRITE;
/**
 * A driver maintains one or more {@link Session}s with a remote
 * Neo4j instance. Through the {@link Session}s you can send queries
 * and retrieve results from the database.
 *
 * Drivers are reasonably expensive to create - you should strive to keep one
 * driver instance around per Neo4j Instance you connect to.
 *
 * @access public
 */
var Driver = /** @class */ (function (_super) {
    __extends(Driver, _super);
    function Driver() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    /**
     * Acquire a reactive session to communicate with the database. The session will
     * borrow connections from the underlying connection pool as required and
     * should be considered lightweight and disposable.
     *
     * This comes with some responsibility - make sure you always call
     * {@link close} when you are done using a session, and likewise,
     * make sure you don't close your session before you are done using it. Once
     * it is closed, the underlying connection will be released to the connection
     * pool and made available for others to use.
     *
     * @public
     * @param {SessionConfig} config
     * @returns {RxSession} new reactive session.
     */
    Driver.prototype.rxSession = function (_a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.defaultAccessMode, defaultAccessMode = _c === void 0 ? WRITE : _c, bookmarks = _b.bookmarks, _d = _b.database, database = _d === void 0 ? '' : _d, fetchSize = _b.fetchSize, impersonatedUser = _b.impersonatedUser, bookmarkManager = _b.bookmarkManager, notificationFilter = _b.notificationFilter, auth = _b.auth;
        return new session_rx_1.default({
            session: this._newSession({
                defaultAccessMode: defaultAccessMode,
                bookmarkOrBookmarks: bookmarks,
                database: database,
                impersonatedUser: impersonatedUser,
                auth: auth,
                reactive: false,
                fetchSize: validateFetchSizeValue(fetchSize, this._config.fetchSize),
                bookmarkManager: bookmarkManager,
                notificationFilter: notificationFilter,
                log: this._log
            }),
            config: this._config,
            log: this._log
        });
    };
    return Driver;
}(neo4j_driver_core_1.Driver));
exports.Driver = Driver;
/**
 * @private
 */
function validateFetchSizeValue(rawValue, defaultWhenAbsent) {
    var fetchSize = parseInt(rawValue, 10);
    if (fetchSize > 0 || fetchSize === FETCH_ALL) {
        return fetchSize;
    }
    else if (fetchSize === 0 || fetchSize < 0) {
        throw new Error("The fetch size can only be a positive value or ".concat(FETCH_ALL, " for ALL. However fetchSize = ").concat(fetchSize));
    }
    else {
        return defaultWhenAbsent;
    }
}
exports.default = Driver;