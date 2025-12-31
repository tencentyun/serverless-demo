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
import Integer from './integer';
import { NumberOrInteger } from './graph-types';
import Notification, { GqlStatusObject } from './notification';
/**
 * A ResultSummary instance contains structured metadata for a {@link Result}.
 * @access public
 */
declare class ResultSummary<T extends NumberOrInteger = Integer> {
    query: {
        text: string;
        parameters: {
            [key: string]: any;
        };
    };
    queryType: string;
    counters: QueryStatistics;
    updateStatistics: QueryStatistics;
    plan: Plan | false;
    profile: ProfiledPlan | false;
    notifications: Notification[];
    gqlStatusObjects: [GqlStatusObject, ...GqlStatusObject[]];
    server: ServerInfo;
    resultConsumedAfter: T;
    resultAvailableAfter: T;
    database: {
        name: string | undefined | null;
    };
    /**
     * @constructor
     * @param {string} query - The query this summary is for
     * @param {Object} parameters - Parameters for the query
     * @param {Object} metadata - Query metadata
     * @param {number|undefined} protocolVersion - Bolt Protocol Version
     */
    constructor(query: string, parameters: {
        [key: string]: any;
    }, metadata: any, protocolVersion?: number);
    /**
     * Check if the result summary has a plan
     * @return {boolean}
     */
    hasPlan(): boolean;
    /**
     * Check if the result summary has a profile
     * @return {boolean}
     */
    hasProfile(): boolean;
}
/**
 * Class for execution plan received by prepending Cypher with EXPLAIN.
 * @access public
 */
declare class Plan {
    operatorType: string;
    identifiers: string[];
    arguments: {
        [key: string]: string;
    };
    children: Plan[];
    /**
     * Create a Plan instance
     * @constructor
     * @param {Object} plan - Object with plan data
     */
    constructor(plan: any);
}
/**
 * Class for execution plan received by prepending Cypher with PROFILE.
 * @access public
 */
declare class ProfiledPlan {
    operatorType: string;
    identifiers: string[];
    arguments: {
        [key: string]: string;
    };
    dbHits: number;
    rows: number;
    pageCacheMisses: number;
    pageCacheHits: number;
    pageCacheHitRatio: number;
    time: number;
    children: ProfiledPlan[];
    /**
     * Create a ProfiledPlan instance
     * @constructor
     * @param {Object} profile - Object with profile data
     */
    constructor(profile: any);
    hasPageCacheStats(): boolean;
}
/**
 * Stats Query statistics dictionary for a {@link QueryStatistics}
 * @public
 */
declare class Stats {
    nodesCreated: number;
    nodesDeleted: number;
    relationshipsCreated: number;
    relationshipsDeleted: number;
    propertiesSet: number;
    labelsAdded: number;
    labelsRemoved: number;
    indexesAdded: number;
    indexesRemoved: number;
    constraintsAdded: number;
    constraintsRemoved: number;
    [key: string]: number;
    /**
     * @constructor
     * @private
     */
    constructor();
}
/**
 * Get statistical information for a {@link Result}.
 * @access public
 */
declare class QueryStatistics {
    private _stats;
    private _systemUpdates;
    private _containsSystemUpdates?;
    private _containsUpdates?;
    /**
     * Structurize the statistics
     * @constructor
     * @param {Object} statistics - Result statistics
     */
    constructor(statistics: any);
    /**
     * Did the database get updated?
     * @return {boolean}
     */
    containsUpdates(): boolean;
    /**
     * Returns the query statistics updates in a dictionary.
     * @returns {Stats}
     */
    updates(): Stats;
    /**
     * Return true if the system database get updated, otherwise false
     * @returns {boolean} - If the system database get updated or not.
     */
    containsSystemUpdates(): boolean;
    /**
     * @returns {number} - Number of system updates
     */
    systemUpdates(): number;
}
/**
 * Class for exposing server info from a result.
 * @access public
 */
declare class ServerInfo {
    address?: string;
    protocolVersion?: number;
    agent?: string;
    /**
     * Create a ServerInfo instance
     * @constructor
     * @param {Object} serverMeta - Object with serverMeta data
     * @param {Object} connectionInfo - Bolt connection info
     * @param {number} protocolVersion - Bolt Protocol Version
     */
    constructor(serverMeta?: any, protocolVersion?: number);
}
/**
 * The constants for query types
 * @type {{SCHEMA_WRITE: string, WRITE_ONLY: string, READ_ONLY: string, READ_WRITE: string}}
 */
declare const queryType: {
    READ_ONLY: string;
    READ_WRITE: string;
    WRITE_ONLY: string;
    SCHEMA_WRITE: string;
};
export { queryType, ServerInfo, Plan, ProfiledPlan, QueryStatistics, Stats };
export default ResultSummary;
