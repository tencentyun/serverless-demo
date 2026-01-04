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
import Integer from '../integer';
import { Logger } from './logger';
/**
 * Internal holder of the transaction configuration.
 * It performs input validation and value conversion for further serialization by the Bolt protocol layer.
 * Users of the driver provide transaction configuration as regular objects `{timeout: 10, metadata: {key: 'value'}}`.
 * Driver converts such objects to {@link TxConfig} immediately and uses converted values everywhere.
 */
export declare class TxConfig {
    readonly timeout: Integer | null;
    readonly metadata: any;
    /**
     * @constructor
     * @param {Object} config the raw configuration object.
     */
    constructor(config: any, log?: Logger);
    /**
     * Get an empty config object.
     * @return {TxConfig} an empty config.
     */
    static empty(): TxConfig;
    /**
     * Check if this config object is empty. I.e. has no configuration values specified.
     * @return {boolean} `true` if this object is empty, `false` otherwise.
     */
    isEmpty(): boolean;
}
