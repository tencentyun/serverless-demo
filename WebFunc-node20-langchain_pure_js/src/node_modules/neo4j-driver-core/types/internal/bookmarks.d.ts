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
declare const BOOKMARKS_KEY = "bookmarks";
export declare class Bookmarks {
    private readonly _values;
    /**
     * @constructor
     * @param {string|string[]} values single bookmark as string or multiple bookmarks as a string array.
     */
    constructor(values?: string | string[] | null);
    static empty(): Bookmarks;
    /**
     * Check if the given Bookmarks holder is meaningful and can be send to the database.
     * @return {boolean} returns `true` bookmarks has a value, `false` otherwise.
     */
    isEmpty(): boolean;
    /**
     * Get all bookmarks values as an array.
     * @return {string[]} all values.
     */
    values(): string[];
    [Symbol.iterator](): IterableIterator<string>;
    /**
     * Get these bookmarks as an object for begin transaction call.
     * @return {Object} the value of this bookmarks holder as object.
     */
    asBeginTransactionParameters(): {
        [BOOKMARKS_KEY]?: string[];
    };
}
export {};
