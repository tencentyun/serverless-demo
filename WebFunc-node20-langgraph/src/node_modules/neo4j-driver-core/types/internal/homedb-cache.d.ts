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
/**
 * Cache which maps users to their last known home database, along with the last time the entry was accessed.
 *
 * @private
 */
export default class HomeDatabaseCache {
    maxSize: number;
    map: Map<string, HomeDatabaseEntry>;
    pruneCount: number;
    constructor(maxSize: number);
    /**
     * Updates or adds an entry to the cache, and prunes the cache if above the maximum allowed size
     *
     * @param {string} user cache key for the user to set
     * @param {string} database new home database to set for the user
     */
    set(user: string, database: string): void;
    /**
     * retrieves the last known home database for a user
     *
     * @param {string} user cache key for the user to get
     */
    get(user: string): string | undefined;
    /**
     * removes the entry for a given user in the cache
     *
     * @param {string} user cache key for the user to remove
     */
    delete(user: string): void;
    /**
     * Removes a number of the oldest entries in the cache if the number of entries has exceeded the maximum size.
     */
    private _pruneCache;
}
/**
 * Interface for an entry in the cache.
 */
interface HomeDatabaseEntry {
    database: string;
    lastUsed: number;
}
export {};
