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
/// <reference types="node" />
import BookmarkManager from '../bookmark-manager';
import Session, { TransactionConfig } from '../session';
import Result from '../result';
import { AuthToken, Query } from '../types';
type SessionFactory = (config: {
    database?: string;
    bookmarkManager?: BookmarkManager;
    impersonatedUser?: string;
    auth?: AuthToken;
}) => Session;
interface ExecutionConfig<T> {
    routing: 'WRITE' | 'READ';
    database?: string;
    impersonatedUser?: string;
    bookmarkManager?: BookmarkManager;
    transactionConfig?: TransactionConfig;
    auth?: AuthToken;
    signal?: AbortSignal;
    resultTransformer: (result: Result) => Promise<T>;
}
export default class QueryExecutor {
    private readonly _createSession;
    constructor(_createSession: SessionFactory);
    execute<T>(config: ExecutionConfig<T>, query: Query, parameters?: any): Promise<T>;
}
export {};
