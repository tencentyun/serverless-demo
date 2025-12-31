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
declare const DEFAULT_MAX_SIZE = 100;
declare const DEFAULT_ACQUISITION_TIMEOUT: number;
export default class PoolConfig {
    readonly maxSize: number;
    readonly acquisitionTimeout: number;
    constructor(maxSize: number, acquisitionTimeout: number);
    static defaultConfig(): PoolConfig;
    static fromDriverConfig(config: {
        maxConnectionPoolSize?: number;
        connectionAcquisitionTimeout?: number;
    }): PoolConfig;
}
export { DEFAULT_MAX_SIZE, DEFAULT_ACQUISITION_TIMEOUT };
