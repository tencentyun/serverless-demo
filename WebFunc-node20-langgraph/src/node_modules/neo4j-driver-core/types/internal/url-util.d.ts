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
declare class Url {
    readonly scheme: string | null;
    readonly host: string;
    readonly port: number;
    readonly hostAndPort: string;
    readonly query: Object;
    constructor(scheme: string | null, host: string, port: number, hostAndPort: string, query: Object);
}
declare function parseDatabaseUrl(url: string): Url;
declare function formatIPv4Address(address: string, port: number): string;
declare function formatIPv6Address(address: string, port: number): string;
declare function defaultPortForScheme(scheme: string | null): number;
export { parseDatabaseUrl, defaultPortForScheme, formatIPv4Address, formatIPv6Address, Url };
