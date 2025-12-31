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
import { ResultStreamObserver } from './internal/observers';
import Result from './result';
import Transaction, { NonAutoCommitApiTelemetryConfig } from './transaction';
import { ConnectionHolder } from './internal/connection-holder';
import { Bookmarks } from './internal/bookmarks';
import { TxConfig } from './internal/tx-config';
import ConnectionProvider from './connection-provider';
import { AuthToken, Query, SessionMode } from './types';
import Connection from './connection';
import { NumberOrInteger } from './graph-types';
import TransactionPromise from './transaction-promise';
import ManagedTransaction from './transaction-managed';
import BookmarkManager from './bookmark-manager';
import { RecordShape } from './record';
import NotificationFilter from './notification-filter';
import { Logger } from './internal/logger';
type ConnectionConsumer<T> = (connection: Connection) => Promise<T> | T;
type TransactionWork<T> = (tx: Transaction) => Promise<T> | T;
type ManagedTransactionWork<T> = (tx: ManagedTransaction) => Promise<T> | T;
interface TransactionConfig {
    timeout?: NumberOrInteger;
    metadata?: object;
}
/**
 * A Session instance is used for handling the connection and
 * sending queries through the connection.
 * In a single session, multiple queries will be executed serially.
 * In order to execute parallel queries, multiple sessions are required.
 * @access public
 */
declare class Session {
    private readonly _mode;
    private _database;
    private readonly _reactive;
    private readonly _fetchSize;
    private readonly _readConnectionHolder;
    private readonly _writeConnectionHolder;
    private _open;
    private _hasTx;
    private _lastBookmarks;
    private _configuredBookmarks;
    private readonly _transactionExecutor;
    private readonly _impersonatedUser?;
    private _databaseNameResolved;
    private readonly _lowRecordWatermark;
    private readonly _highRecordWatermark;
    private readonly _results;
    private readonly _bookmarkManager?;
    private readonly _notificationFilter?;
    private readonly _log;
    private readonly _homeDatabaseCallback;
    private readonly _auth;
    private _databaseGuess;
    private readonly _isRoutingSession;
    /**
     * @constructor
     * @protected
     * @param {Object} args
     * @param {string} args.mode the default access mode for this session.
     * @param {ConnectionProvider} args.connectionProvider - The connection provider to acquire connections from.
     * @param {Bookmarks} args.bookmarks - The initial bookmarks for this session.
     * @param {string} args.database the database name
     * @param {Object} args.config={} - This driver configuration.
     * @param {boolean} args.reactive - Whether this session should create reactive streams
     * @param {number} args.fetchSize - Defines how many records is pulled in each pulling batch
     * @param {string} args.impersonatedUser - The username which the user wants to impersonate for the duration of the session.
     * @param {BookmarkManager} args.bookmarkManager - The bookmark manager used for this session.
     * @param {NotificationFilter} args.notificationFilter - The notification filter used for this session.
     * @param {AuthToken} args.auth - the target auth for the to-be-acquired connection
     * @param {Logger} args.log - the logger used for logs in this session.
     * @param {(user:string, database:string) => void} args.homeDatabaseCallback - callback used to update the home database cache
     */
    constructor({ mode, connectionProvider, bookmarks, database, config, reactive, fetchSize, impersonatedUser, bookmarkManager, notificationFilter, auth, log, homeDatabaseCallback }: {
        mode: SessionMode;
        connectionProvider: ConnectionProvider;
        bookmarks?: Bookmarks;
        database: string;
        config: any;
        reactive: boolean;
        fetchSize: number;
        impersonatedUser?: string;
        bookmarkManager?: BookmarkManager;
        notificationFilter?: NotificationFilter;
        auth?: AuthToken;
        log: Logger;
        homeDatabaseCallback?: (user: string, database: string) => void;
    });
    /**
     * Run Cypher query
     * Could be called with a query object i.e.: `{text: "MATCH ...", parameters: {param: 1}}`
     * or with the query and parameters as separate arguments.
     *
     * @public
     * @param {mixed} query - Cypher query to execute
     * @param {Object} parameters - Map with parameters to use in query
     * @param {TransactionConfig} [transactionConfig] - Configuration for the new auto-commit transaction.
     * @return {Result} New Result.
     */
    run<R extends RecordShape = RecordShape>(query: Query, parameters?: any, transactionConfig?: TransactionConfig): Result<R>;
    _run<T extends ResultStreamObserver = ResultStreamObserver>(query: Query, parameters: any, customRunner: ConnectionConsumer<T>): Result;
    /**
     * This method is used by Rediscovery on the neo4j-driver-bolt-protocol package.
     *
     * @private
     * @param {function()} connectionConsumer The method which will use the connection
     * @returns {Promise<T>} A connection promise
     */
    _acquireConnection<T>(connectionConsumer: ConnectionConsumer<T>): Promise<T>;
    /**
     * Acquires a {@link Connection}, consume it and return a promise of the result along with
     * the {@link ConnectionHolder} used in the process.
     *
     * @private
     * @param connectionConsumer
     * @returns {object} The connection holder and connection promise.
     */
    private _acquireAndConsumeConnection;
    /**
     * Begin a new transaction in this session. A session can have at most one transaction running at a time, if you
     * want to run multiple concurrent transactions, you should use multiple concurrent sessions.
     *
     * While a transaction is open the session cannot be used to run queries outside the transaction.
     *
     * @param {TransactionConfig} [transactionConfig] - Configuration for the new auto-commit transaction.
     * @returns {TransactionPromise} New Transaction.
     */
    beginTransaction(transactionConfig?: TransactionConfig): TransactionPromise;
    _beginTransaction(accessMode: SessionMode, txConfig: TxConfig, apiTelemetryConfig?: NonAutoCommitApiTelemetryConfig): TransactionPromise;
    /**
     * @private
     * @returns {void}
     */
    _assertSessionIsOpen(): void;
    /**
     * @private
     * @returns {void}
     */
    _transactionClosed(): void;
    /**
     * Return the bookmarks received following the last completed {@link Transaction}.
     *
     * @deprecated This method will be removed in version 6.0. Please, use {@link Session#lastBookmarks} instead.
     *
     * @return {string[]} A reference to a previous transaction.
     * @see {@link Session#lastBookmarks}
     */
    lastBookmark(): string[];
    /**
     * Return the bookmarks received following the last completed {@link Transaction}.
     *
     * @return {string[]} A reference to a previous transaction.
     */
    lastBookmarks(): string[];
    private _bookmarks;
    /**
     * Execute given unit of work in a {@link READ} transaction.
     *
     * Transaction will automatically be committed unless the given function throws or returns a rejected promise.
     * Some failures of the given function or the commit itself will be retried with exponential backoff with initial
     * delay of 1 second and maximum retry time of 30 seconds. Maximum retry time is configurable via driver config's
     * `maxTransactionRetryTime` property in milliseconds.
     *
     * @deprecated This method will be removed in version 6.0. Please, use {@link Session#executeRead} instead.
     *
     * @param {function(tx: Transaction): Promise} transactionWork - Callback that executes operations against
     * a given {@link Transaction}.
     * @param {TransactionConfig} [transactionConfig] - Configuration for all transactions started to execute the unit of work.
     * @return {Promise} Resolved promise as returned by the given function or rejected promise when given
     * function or commit fails.
     * @see {@link Session#executeRead}
     */
    readTransaction<T>(transactionWork: TransactionWork<T>, transactionConfig?: TransactionConfig): Promise<T>;
    /**
     * Execute given unit of work in a {@link WRITE} transaction.
     *
     * Transaction will automatically be committed unless the given function throws or returns a rejected promise.
     * Some failures of the given function or the commit itself will be retried with exponential backoff with initial
     * delay of 1 second and maximum retry time of 30 seconds. Maximum retry time is configurable via driver config's
     * `maxTransactionRetryTime` property in milliseconds.
     *
     * @deprecated This method will be removed in version 6.0. Please, use {@link Session#executeWrite} instead.
     *
     * @param {function(tx: Transaction): Promise} transactionWork - Callback that executes operations against
     * a given {@link Transaction}.
     * @param {TransactionConfig} [transactionConfig] - Configuration for all transactions started to execute the unit of work.
     * @return {Promise} Resolved promise as returned by the given function or rejected promise when given
     * function or commit fails.
     * @see {@link Session#executeWrite}
     */
    writeTransaction<T>(transactionWork: TransactionWork<T>, transactionConfig?: TransactionConfig): Promise<T>;
    _runTransaction<T>(accessMode: SessionMode, transactionConfig: TxConfig, transactionWork: TransactionWork<T>): Promise<T>;
    /**
     * Execute given unit of work in a {@link READ} transaction.
     *
     * Transaction will automatically be committed unless the given function throws or returns a rejected promise.
     * Some failures of the given function or the commit itself will be retried with exponential backoff with initial
     * delay of 1 second and maximum retry time of 30 seconds. Maximum retry time is configurable via driver config's
     * `maxTransactionRetryTime` property in milliseconds.
     *
     * NOTE: Because it is an explicit transaction from the server point of view, Cypher queries using
     * "CALL {} IN TRANSACTIONS" or the older "USING PERIODIC COMMIT" construct will not work (call
     * {@link Session#run} for these).
     *
     * @param {function(tx: ManagedTransaction): Promise} transactionWork - Callback that executes operations against
     * a given {@link Transaction}.
     * @param {TransactionConfig} [transactionConfig] - Configuration for all transactions started to execute the unit of work.
     * @return {Promise} Resolved promise as returned by the given function or rejected promise when given
     * function or commit fails.
     */
    executeRead<T>(transactionWork: ManagedTransactionWork<T>, transactionConfig?: TransactionConfig): Promise<T>;
    /**
     * Execute given unit of work in a {@link WRITE} transaction.
     *
     * Transaction will automatically be committed unless the given function throws or returns a rejected promise.
     * Some failures of the given function or the commit itself will be retried with exponential backoff with initial
     * delay of 1 second and maximum retry time of 30 seconds. Maximum retry time is configurable via driver config's
     * `maxTransactionRetryTime` property in milliseconds.
     *
     * NOTE: Because it is an explicit transaction from the server point of view, Cypher queries using
     * "CALL {} IN TRANSACTIONS" or the older "USING PERIODIC COMMIT" construct will not work (call
     * {@link Session#run} for these).
     *
     * @param {function(tx: ManagedTransaction): Promise} transactionWork - Callback that executes operations against
     * a given {@link Transaction}.
     * @param {TransactionConfig} [transactionConfig] - Configuration for all transactions started to execute the unit of work.
     * @return {Promise} Resolved promise as returned by the given function or rejected promise when given
     * function or commit fails.
     */
    executeWrite<T>(transactionWork: ManagedTransactionWork<T>, transactionConfig?: TransactionConfig): Promise<T>;
    /**
     * @private
     * @param {SessionMode} accessMode
     * @param {TxConfig} transactionConfig
     * @param {ManagedTransactionWork} transactionWork
     * @returns {Promise}
     */
    private _executeInTransaction;
    /**
     * Sets the resolved database name in the session context.
     * @private
     * @param {string|undefined} database The resolved database name
     * @returns {void}
     */
    _onDatabaseNameResolved(database?: string): void;
    private _getConnectionAcquistionBookmarks;
    /**
     * Update value of the last bookmarks.
     * @private
     * @param {Bookmarks} newBookmarks - The new bookmarks.
     * @returns {void}
     */
    _updateBookmarks(newBookmarks?: Bookmarks, previousBookmarks?: Bookmarks, database?: string): void;
    /**
     * Close this session.
     * @return {Promise}
     */
    close(): Promise<void>;
    _connectionHolderWithMode(mode: SessionMode): ConnectionHolder;
    /**
     * @private
     * @param {Object} meta Connection metadatada
     * @returns {void}
     */
    _onCompleteCallback(meta: {
        bookmark: string | string[];
        db?: string;
    }, previousBookmarks?: Bookmarks): void;
    /**
     * @private
     * @returns {void}
     */
    private _calculateWatermaks;
    /**
     * Configure the transaction executor
     *
     * This used by {@link Driver#executeQuery}
     * @private
     * @returns {void}
     */
    private _configureTransactionExecutor;
    /**
     * @protected
     */
    static _validateSessionMode(rawMode?: SessionMode): SessionMode;
}
export default Session;
export type { TransactionConfig };
