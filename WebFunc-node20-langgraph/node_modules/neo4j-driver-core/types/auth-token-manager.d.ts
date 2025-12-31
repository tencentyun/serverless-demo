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
import { AuthToken } from './types';
export type SecurityErrorCode = `Neo.ClientError.Security.${string}`;
/**
 * Interface for the piece of software responsible for keeping track of current active {@link AuthToken} across the driver.
 * @interface
 * @since 5.14
 */
export default class AuthTokenManager {
    /**
     * Returns a valid token.
     *
     * **Warning**: This method must only ever return auth information belonging to the same identity.
     * Switching identities using the `AuthTokenManager` is undefined behavior.
     *
     * @returns {Promise<AuthToken>|AuthToken} The valid auth token or a promise for a valid auth token
     */
    getToken(): Promise<AuthToken> | AuthToken;
    /**
     * Handles an error notification emitted by the server if a security error happened.
     *
     * @param {AuthToken} token The expired token.
     * @param {`Neo.ClientError.Security.${string}`} securityErrorCode the security error code returned by the server
     * @return {boolean} whether the exception was handled by the manager, so the driver knows if it can be retried..
     */
    handleSecurityException(token: AuthToken, securityErrorCode: SecurityErrorCode): boolean;
}
/**
 * Interface which defines an {@link AuthToken} with an expiration data time associated
 * @interface
 * @since 5.14
 */
export declare class AuthTokenAndExpiration {
    readonly token: AuthToken;
    readonly expiration?: Date;
    private constructor();
}
/**
 * Defines the object which holds the common {@link AuthTokenManager} used in the Driver
 */
declare class AuthTokenManagers {
    /**
     * Creates a {@link AuthTokenManager} for handle {@link AuthToken} which is expires.
     *
     * **Warning**: `tokenProvider` must only ever return auth information belonging to the same identity.
     * Switching identities using the `AuthTokenManager` is undefined behavior.
     *
     * @param {object} param0 - The params
     * @param {function(): Promise<AuthTokenAndExpiration>} param0.tokenProvider - Retrieves a new valid auth token.
     * Must only ever return auth information belonging to the same identity.
     * @returns {AuthTokenManager} The temporal auth data manager.
     */
    bearer({ tokenProvider }: {
        tokenProvider: () => Promise<AuthTokenAndExpiration>;
    }): AuthTokenManager;
    /**
     * Creates a {@link AuthTokenManager} for handle {@link AuthToken} and password rotation.
     *
     * **Warning**: `tokenProvider` must only ever return auth information belonging to the same identity.
     * Switching identities using the `AuthTokenManager` is undefined behavior.
     *
     * @param {object} param0 - The params
     * @param {function(): Promise<AuthToken>} param0.tokenProvider - Retrieves a new valid auth token.
     * Must only ever return auth information belonging to the same identity.
     * @returns {AuthTokenManager} The basic auth data manager.
     */
    basic({ tokenProvider }: {
        tokenProvider: () => Promise<AuthToken>;
    }): AuthTokenManager;
}
/**
 * Holds the common {@link AuthTokenManagers} used in the Driver.
 */
declare const authTokenManagers: AuthTokenManagers;
export { authTokenManagers };
export type { AuthTokenManagers };
/**
 * Create a {@link AuthTokenManager} for handle static {@link AuthToken}
 *
 * @private
 * @param {param} args - The args
 * @param {AuthToken} args.authToken - The static auth token which will always used in the driver.
 * @returns {AuthTokenManager} The temporal auth data manager.
 */
export declare function staticAuthTokenManager({ authToken }: {
    authToken: AuthToken;
}): AuthTokenManager;
