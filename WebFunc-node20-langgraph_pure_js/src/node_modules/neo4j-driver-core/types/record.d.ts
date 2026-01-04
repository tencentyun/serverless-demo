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
type RecordShape<Key extends PropertyKey = PropertyKey, Value = any> = {
    [K in Key]: Value;
};
type Visitor<Entries extends RecordShape = RecordShape, Key extends keyof Entries = keyof Entries> = MapVisitor<void, Entries, Key>;
type MapVisitor<ReturnType, Entries extends RecordShape = RecordShape, Key extends keyof Entries = keyof Entries> = (value: Entries[Key], key: Key, record: Record<Entries>) => ReturnType;
/**
 * Records make up the contents of the {@link Result}, and is how you access
 * the output of a query. A simple query might yield a result stream
 * with a single record, for instance:
 *
 *     MATCH (u:User) RETURN u.name, u.age
 *
 * This returns a stream of records with two fields, named `u.name` and `u.age`,
 * each record represents one user found by the query above. You can access
 * the values of each field either by name:
 *
 *     record.get("u.name")
 *
 * Or by it's position:
 *
 *     record.get(0)
 *
 * @access public
 */
declare class Record<Entries extends RecordShape = RecordShape, Key extends keyof Entries = keyof Entries, FieldLookup extends RecordShape<keyof Entries, number> = RecordShape<keyof Entries, number>> {
    keys: Key[];
    length: number;
    private readonly _fields;
    private readonly _fieldLookup;
    /**
     * Create a new record object.
     * @constructor
     * @protected
     * @param {string[]} keys An array of field keys, in the order the fields appear in the record
     * @param {Array} fields An array of field values
     * @param {Object} fieldLookup An object of fieldName -> value index, used to map
     *                            field names to values. If this is null, one will be
     *                            generated.
     */
    constructor(keys: Key[], fields: any[], fieldLookup?: FieldLookup);
    /**
     * Run the given function for each field in this record. The function
     * will get three arguments - the value, the key and this record, in that
     * order.
     *
     * @param {function(value: Object, key: string, record: Record)} visitor the function to apply to each field.
     * @returns {void} Nothing
     */
    forEach(visitor: Visitor<Entries, Key>): void;
    /**
     * Run the given function for each field in this record. The function
     * will get three arguments - the value, the key and this record, in that
     * order.
     *
     * @param {function(value: Object, key: string, record: Record)} visitor the function to apply on each field
     * and return a value that is saved to the returned Array.
     *
     * @returns {Array}
     */
    map<Value>(visitor: MapVisitor<Value, Entries, Key>): Value[];
    /**
     * Iterate over results. Each iteration will yield an array
     * of exactly two items - the key, and the value (in order).
     *
     * @generator
     * @returns {IterableIterator<Array>}
     */
    entries(): IterableIterator<[string, any]>;
    /**
     * Iterate over values.
     *
     * @generator
     * @returns {IterableIterator<Object>}
     */
    values(): IterableIterator<Object>;
    /**
     * Iterate over values. Delegates to {@link Record#values}
     *
     * @generator
     * @returns {IterableIterator<Object>}
     */
    [Symbol.iterator](): IterableIterator<Object>;
    /**
     * Generates an object out of the current Record
     *
     * @returns {Object}
     */
    toObject(): Entries;
    get<K extends keyof Entries = keyof Entries>(key: K): Entries[K];
    get(n: number): any;
    /**
     * Check if a value from this record, either by index or by field key, exists.
     *
     * @param {string|Number} key Field key, or the index of the field.
     * @returns {boolean}
     */
    has(key: Key | string | number): boolean;
}
export default Record;
export type { RecordShape };
