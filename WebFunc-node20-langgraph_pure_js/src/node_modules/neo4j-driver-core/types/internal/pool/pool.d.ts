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
import PoolConfig from './pool-config';
import { Logger } from '../logger';
import { ServerAddress } from '../server-address';
type Release<R extends unknown = unknown> = (address: ServerAddress, resource: R) => Promise<void>;
type Create<R extends unknown = unknown> = (acquisitionContext: unknown, address: ServerAddress, release: Release<R>) => Promise<R>;
type Destroy<R extends unknown = unknown> = (resource: R) => Promise<void>;
type ValidateOnAcquire<R extends unknown = unknown> = (acquisitionContext: unknown, resource: R) => (Promise<boolean> | boolean);
type ValidateOnRelease<R extends unknown = unknown> = (resource: R) => (Promise<boolean> | boolean);
type InstallObserver<R extends unknown = unknown> = (resource: R, observer: unknown) => void;
type RemoveObserver<R extends unknown = unknown> = (resource: R) => void;
interface AcquisitionConfig {
    requireNew?: boolean;
}
interface ConstructorParam<R extends unknown = unknown> {
    create?: Create<R>;
    destroy?: Destroy<R>;
    validateOnAcquire?: ValidateOnAcquire<R>;
    validateOnRelease?: ValidateOnRelease<R>;
    installIdleObserver?: InstallObserver<R>;
    removeIdleObserver?: RemoveObserver<R>;
    config?: PoolConfig;
    log?: Logger;
}
declare class Pool<R extends unknown = unknown> {
    private readonly _create;
    private readonly _destroy;
    private readonly _validateOnAcquire;
    private readonly _validateOnRelease;
    private readonly _installIdleObserver;
    private readonly _removeIdleObserver;
    private readonly _maxSize;
    private readonly _acquisitionTimeout;
    private readonly _log;
    private readonly _pools;
    private readonly _pendingCreates;
    private readonly _acquireRequests;
    private readonly _activeResourceCounts;
    private _closed;
    /**
     * @param {function(acquisitionContext: object, address: ServerAddress, function(address: ServerAddress, resource: object): Promise<object>): Promise<object>} create
     *                an allocation function that creates a promise with a new resource. It's given an address for which to
     *                allocate the connection and a function that will return the resource to the pool if invoked, which is
     *                meant to be called on .dispose or .close or whatever mechanism the resource uses to finalize.
     * @param {function(acquisitionContext: object, resource: object): boolean} validateOnAcquire
     *                called at various times when an instance is acquired
     *                If this returns false, the resource will be evicted
     * @param {function(resource: object): boolean} validateOnRelease
     *                called at various times when an instance is released
     *                If this returns false, the resource will be evicted
     * @param {function(resource: object): Promise<void>} destroy
     *                called with the resource when it is evicted from this pool
     * @param {function(resource: object, observer: { onError }): void} installIdleObserver
     *                called when the resource is released back to pool
     * @param {function(resource: object): void} removeIdleObserver
     *                called when the resource is acquired from the pool
     * @param {PoolConfig} config configuration for the new driver.
     * @param {Logger} log the driver logger.
     */
    constructor({ create, destroy, validateOnAcquire, validateOnRelease, installIdleObserver, removeIdleObserver, config, log }: ConstructorParam<R>);
    /**
     * Acquire and idle resource fom the pool or create a new one.
     * @param {object} acquisitionContext the acquisition context used for create and validateOnAcquire connection
     * @param {ServerAddress} address the address for which we're acquiring.
     * @param {object} config the config
     * @param {boolean} config.requireNew Indicate it requires a new resource
     * @return {Promise<Object>} resource that is ready to use.
     */
    acquire(acquisitionContext: unknown, address: ServerAddress, config?: AcquisitionConfig): Promise<R>;
    /**
     * Destroy all idle resources for the given address.
     * @param {ServerAddress} address the address of the server to purge its pool.
     * @returns {Promise<void>} A promise that is resolved when the resources are purged
     */
    purge(address: ServerAddress): Promise<void>;
    apply(address: ServerAddress, resourceConsumer: (resource: R) => void): void;
    /**
     * Destroy all idle resources in this pool.
     * @returns {Promise<void>} A promise that is resolved when the resources are purged
     */
    close(): Promise<void>;
    /**
     * Keep the idle resources for the provided addresses and purge the rest.
     * @returns {Promise<void>} A promise that is resolved when the other resources are purged
     */
    keepAll(addresses: ServerAddress[]): Promise<void>;
    /**
     * Check if this pool contains resources for the given address.
     * @param {ServerAddress} address the address of the server to check.
     * @return {boolean} `true` when pool contains entries for the given key, <code>false</code> otherwise.
     */
    has(address: ServerAddress): boolean;
    /**
     * Get count of active (checked out of the pool) resources for the given key.
     * @param {ServerAddress} address the address of the server to check.
     * @return {number} count of resources acquired by clients.
     */
    activeResourceCount(address: ServerAddress): number;
    _getOrInitializePoolFor(key: string): SingleAddressPool<R>;
    _acquire(acquisitionContext: unknown, address: ServerAddress, requireNew: boolean): Promise<{
        resource: R | null;
        pool: SingleAddressPool<R>;
    }>;
    _release(address: ServerAddress, resource: R, pool: SingleAddressPool<R>): Promise<void>;
    _purgeKey(key: string): Promise<void>;
    _processPendingAcquireRequests(address: ServerAddress): void;
}
declare class SingleAddressPool<R extends unknown = unknown> {
    private _active;
    private _elements;
    private _elementsInUse;
    constructor();
    isActive(): boolean;
    close(): void;
    filter(predicate: (resource: R) => boolean): SingleAddressPool<R>;
    apply(resourceConsumer: (resource: R) => void): void;
    get length(): number;
    pop(): R | undefined;
    push(element: R): number;
    pushInUse(element: R): void;
    removeInUse(element: R): void;
}
export default Pool;
