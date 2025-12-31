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
declare const FETCH_ALL = -1;
declare const DEFAULT_POOL_ACQUISITION_TIMEOUT: number;
declare const DEFAULT_POOL_MAX_SIZE = 100;
declare const DEFAULT_CONNECTION_TIMEOUT_MILLIS = 30000;
declare const ACCESS_MODE_READ: 'READ';
declare const ACCESS_MODE_WRITE: 'WRITE';
declare const BOLT_PROTOCOL_V1: number;
declare const BOLT_PROTOCOL_V2: number;
declare const BOLT_PROTOCOL_V3: number;
declare const BOLT_PROTOCOL_V4_0: number;
declare const BOLT_PROTOCOL_V4_1: number;
declare const BOLT_PROTOCOL_V4_2: number;
declare const BOLT_PROTOCOL_V4_3: number;
declare const BOLT_PROTOCOL_V4_4: number;
declare const BOLT_PROTOCOL_V5_0: number;
declare const BOLT_PROTOCOL_V5_1: number;
declare const BOLT_PROTOCOL_V5_2: number;
declare const BOLT_PROTOCOL_V5_3: number;
declare const BOLT_PROTOCOL_V5_4: number;
declare const BOLT_PROTOCOL_V5_5: number;
declare const BOLT_PROTOCOL_V5_6: number;
declare const BOLT_PROTOCOL_V5_7: number;
declare const BOLT_PROTOCOL_V5_8: number;
declare const TELEMETRY_APIS: {
    readonly MANAGED_TRANSACTION: 0;
    readonly UNMANAGED_TRANSACTION: 1;
    readonly AUTO_COMMIT_TRANSACTION: 2;
    readonly EXECUTE_QUERY: 3;
};
export type TelemetryApis = typeof TELEMETRY_APIS[keyof typeof TELEMETRY_APIS];
export type AccessMode = typeof ACCESS_MODE_READ | typeof ACCESS_MODE_WRITE;
export { FETCH_ALL, ACCESS_MODE_READ, ACCESS_MODE_WRITE, DEFAULT_CONNECTION_TIMEOUT_MILLIS, DEFAULT_POOL_ACQUISITION_TIMEOUT, DEFAULT_POOL_MAX_SIZE, BOLT_PROTOCOL_V1, BOLT_PROTOCOL_V2, BOLT_PROTOCOL_V3, BOLT_PROTOCOL_V4_0, BOLT_PROTOCOL_V4_1, BOLT_PROTOCOL_V4_2, BOLT_PROTOCOL_V4_3, BOLT_PROTOCOL_V4_4, BOLT_PROTOCOL_V5_0, BOLT_PROTOCOL_V5_1, BOLT_PROTOCOL_V5_2, BOLT_PROTOCOL_V5_3, BOLT_PROTOCOL_V5_4, BOLT_PROTOCOL_V5_5, BOLT_PROTOCOL_V5_6, BOLT_PROTOCOL_V5_7, BOLT_PROTOCOL_V5_8, TELEMETRY_APIS };
