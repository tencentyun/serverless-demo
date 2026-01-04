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
import Connection, { ApiTelemetryConfig } from './connection';
import { ConnectionHolder } from './internal/connection-holder';
import { Bookmarks } from './internal/bookmarks';
import { TxConfig } from './internal/tx-config';
import Result from './result';
import { Query } from './types';
import { RecordShape } from './record';
import NotificationFilter from './notification-filter';
import { TelemetryApis, TELEMETRY_APIS } from './internal/constants';
type NonAutoCommitTelemetryApis = Exclude<TelemetryApis, typeof TELEMETRY_APIS.AUTO_COMMIT_TRANSACTION>;
type NonAutoCommitApiTelemetryConfig = ApiTelemetryConfig<NonAutoCommitTelemetryApis>;
/**
 * Represents a transaction in the Neo4j database.
 *
 * @access public
 */
declare class Transaction {
    private readonly _connectionHolder;
    private readonly _reactive;
    private _state;
    private readonly _onClose;
    private readonly _onBookmarks;
    private readonly _onConnection;
    private readonly _onError;
    private readonly _onComplete;
    private readonly _fetchSize;
    private readonly _results;
    private readonly _impersonatedUser?;
    private readonly _lowRecordWatermak;
    private readonly _highRecordWatermark;
    private _bookmarks;
    private readonly _activePromise;
    private _acceptActive;
    private readonly _notificationFilter?;
    private readonly _apiTelemetryConfig?;
    /**
     * @constructor
     * @param {object} args
     * @param {ConnectionHolder} args.connectionHolder - the connection holder to get connection from.
     * @param {function()} args.onClose - Function to be called when transaction is committed or rolled back.
     * @param {function(bookmarks: Bookmarks)} args.onBookmarks callback invoked when new bookmark is produced.
     * @param {function()} args.onConnection - Function to be called when a connection is obtained to ensure the conneciton
     * is not yet released.
     * @param {boolean} args.reactive whether this transaction generates reactive streams
     * @param {number} args.fetchSize - the record fetch size in each pulling batch.
     * @param {string} args.impersonatedUser - The name of the user which should be impersonated for the duration of the session.
     * @param {number} args.highRecordWatermark - The high watermark for the record buffer.
     * @param {number} args.lowRecordWatermark - The low watermark for the record buffer.
     * @param {NotificationFilter} args.notificationFilter - The notification filter used for this transaction.
     * @param {NonAutoCommitApiTelemetryConfig} args.apiTelemetryConfig - The api telemetry configuration. Empty/Null for disabling telemetry
     */
    constructor({ connectionHolder, onClose, onBookmarks, onConnection, reactive, fetchSize, impersonatedUser, highRecordWatermark, lowRecordWatermark, notificationFilter, apiTelemetryConfig }: {
        connectionHolder: ConnectionHolder;
        onClose: () => void;
        onBookmarks: (newBookmarks: Bookmarks, previousBookmarks: Bookmarks, database?: string) => void;
        onConnection: () => void;
        reactive: boolean;
        fetchSize: number;
        impersonatedUser?: string;
        highRecordWatermark: number;
        lowRecordWatermark: number;
        notificationFilter?: NotificationFilter;
        apiTelemetryConfig?: NonAutoCommitApiTelemetryConfig;
    });
    /**
     * @private
     * @param {Bookmarks | string |  string []} bookmarks
     * @param {TxConfig} txConfig
     * @param {Object} events List of observers to events
     * @returns {void}
     */
    _begin(getBookmarks: () => Promise<Bookmarks>, txConfig: TxConfig, events?: {
        onError: (error: Error) => void;
        onComplete: (metadata: any) => void;
        onDB: (database: string) => void;
    }): void;
    /**
     * Run Cypher query
     * Could be called with a query object i.e.: `{text: "MATCH ...", parameters: {param: 1}}`
     * or with the query and parameters as separate arguments.
     * @param {mixed} query - Cypher query to execute
     * @param {Object} parameters - Map with parameters to use in query
     * @return {Result} New Result
     */
    run<R extends RecordShape = RecordShape>(query: Query, parameters?: any): Result<R>;
    /**
     * Commits the transaction and returns the result.
     *
     * After committing the transaction can no longer be used.
     *
     * @returns {Promise<void>} An empty promise if committed successfully or error if any error happened during commit.
     */
    commit(): Promise<void>;
    /**
     * Rollbacks the transaction.
     *
     * After rolling back, the transaction can no longer be used.
     *
     * @returns {Promise<void>} An empty promise if rolled back successfully or error if any error happened during
     * rollback.
     */
    rollback(): Promise<void>;
    /**
     * Check if this transaction is active, which means commit and rollback did not happen.
     * @return {boolean} `true` when not committed and not rolled back, `false` otherwise.
     */
    isOpen(): boolean;
    /**
     * Closes the transaction
     *
     * This method will roll back the transaction if it is not already committed or rolled back.
     *
     * @returns {Promise<void>} An empty promise if closed successfully or error if any error happened during
     */
    close(): Promise<void>;
    _onErrorCallback(error: Error): Promise<Connection | null>;
    /**
     * @private
     * @param {object} meta The meta with bookmarks
     * @returns {void}
     */
    _onCompleteCallback(meta: {
        bookmark?: string | string[];
        db?: string;
    }, previousBookmarks?: Bookmarks): void;
}
export default Transaction;
export type { NonAutoCommitTelemetryApis, NonAutoCommitApiTelemetryConfig };
