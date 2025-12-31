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
import Connection from '../connection';
import { AccessMode } from './constants';
import { Bookmarks } from './bookmarks';
import ConnectionProvider from '../connection-provider';
import { AuthToken } from '../types';
import { Logger } from './logger';
/**
 * @private
 */
interface ConnectionHolderInterface {
    /**
     * Returns the assigned access mode.
     * @returns {string} access mode
     */
    mode: () => string | undefined;
    /**
     * Returns the target database name
     * @returns {string} the database name
     */
    database: () => string | undefined;
    /**
     * Returns the bookmarks
     */
    bookmarks: () => Bookmarks;
    /**
     * Make this holder initialize new connection if none exists already.
     * @return {boolean}
     */
    initializeConnection: () => boolean;
    /**
     * Get the current connection promise.
     * @return {Promise<Connection>} promise resolved with the current connection.
     */
    getConnection: () => Promise<Connection | null>;
    /**
     * Notify this holder that single party does not require current connection any more.
     * @return {Promise<Connection>} promise resolved with the current connection, never a rejected promise.
     */
    releaseConnection: () => Promise<Connection | null>;
    /**
     * Closes this holder and releases current connection (if any) despite any existing users.
     * @return {Promise<Connection>} promise resolved when current connection is released to the pool.
     */
    close: () => Promise<Connection | null>;
}
/**
 * Utility to lazily initialize connections and return them back to the pool when unused.
 * @private
 */
declare class ConnectionHolder implements ConnectionHolderInterface {
    private readonly _mode;
    private _database?;
    private readonly _bookmarks;
    private readonly _connectionProvider?;
    private _referenceCount;
    private _connectionPromise;
    private readonly _impersonatedUser?;
    private readonly _getConnectionAcquistionBookmarks;
    private readonly _onDatabaseNameResolved?;
    private readonly _auth?;
    private readonly _log;
    private _closed;
    /**
     * @constructor
     * @param {object} params
     * @property {string} params.mode - the access mode for new connection holder.
     * @property {string} params.database - the target database name.
     * @property {Bookmarks} params.bookmarks - initial bookmarks
     * @property {ConnectionProvider} params.connectionProvider - the connection provider to acquire connections from.
     * @property {string?} params.impersonatedUser - the user which will be impersonated
     * @property {function(databaseName:string)} params.onDatabaseNameResolved - callback called when the database name is resolved
     * @property {function():Promise<Bookmarks>} params.getConnectionAcquistionBookmarks - called for getting Bookmarks for acquiring connections
     * @property {AuthToken} params.auth - the target auth for the to-be-acquired connection
     */
    constructor({ mode, database, bookmarks, connectionProvider, impersonatedUser, onDatabaseNameResolved, getConnectionAcquistionBookmarks, auth, log }: {
        mode?: AccessMode;
        database?: string;
        bookmarks?: Bookmarks;
        connectionProvider?: ConnectionProvider;
        impersonatedUser?: string;
        onDatabaseNameResolved?: (database: string) => void;
        getConnectionAcquistionBookmarks?: () => Promise<Bookmarks>;
        auth?: AuthToken;
        log: Logger;
    });
    mode(): AccessMode | undefined;
    database(): string | undefined;
    setDatabase(database?: string): void;
    bookmarks(): Bookmarks;
    connectionProvider(): ConnectionProvider | undefined;
    referenceCount(): number;
    initializeConnection(homeDatabase?: string): boolean;
    private _createConnectionPromise;
    private _getBookmarks;
    getConnection(): Promise<Connection | null>;
    releaseConnection(): Promise<null | Connection>;
    close(hasTx?: boolean): Promise<null | Connection>;
    log(): Logger;
    /**
     * Return the current pooled connection instance to the connection pool.
     * We don't pool Session instances, to avoid users using the Session after they've called close.
     * The `Session` object is just a thin wrapper around Connection anyway, so it makes little difference.
     * @return {Promise} - promise resolved then connection is returned to the pool.
     * @private
     */
    private _releaseConnection;
    _logError(error: Error): null;
}
/**
 * Provides a interaction with a ConnectionHolder without change it state by
 * releasing or initilizing
 */
export default class ReadOnlyConnectionHolder extends ConnectionHolder {
    private readonly _connectionHolder;
    /**
     * Constructor
     * @param {ConnectionHolder} connectionHolder the connection holder which will treat the requests
     */
    constructor(connectionHolder: ConnectionHolder);
    /**
     * Return the true if the connection is suppose to be initilized with the command.
     *
     * @return {boolean}
     */
    initializeConnection(): boolean;
    /**
     * Get the current connection promise.
     * @return {Promise<Connection>} promise resolved with the current connection.
     */
    getConnection(): Promise<Connection | null>;
    /**
     * Get the current connection promise, doesn't performs the release
     * @return {Promise<Connection>} promise with the resolved current connection
     */
    releaseConnection(): Promise<Connection | null>;
    /**
     * Get the current connection promise, doesn't performs the connection close
     * @return {Promise<Connection>} promise with the resolved current connection
     */
    close(): Promise<Connection | null>;
}
declare class EmptyConnectionHolder extends ConnectionHolder {
    constructor();
    mode(): undefined;
    database(): undefined;
    initializeConnection(): boolean;
    getConnection(): Promise<Connection>;
    releaseConnection(): Promise<null>;
    close(): Promise<null>;
}
/**
 * Connection holder that does not manage any connections.
 * @type {ConnectionHolder}
 * @private
 */
declare const EMPTY_CONNECTION_HOLDER: EmptyConnectionHolder;
export { ConnectionHolder, ReadOnlyConnectionHolder, EMPTY_CONNECTION_HOLDER };
