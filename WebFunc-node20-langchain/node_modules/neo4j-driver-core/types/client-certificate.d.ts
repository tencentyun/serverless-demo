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
type KeyFile = string | {
    path: string;
    password?: string;
};
/**
 * Represents KeyFile represented as file.
 *
 * @typedef {object} KeyFileObject
 * @property {string} path - The path of the file
 * @property {string|undefined} password - the password of the key. If none,
 * the password defined at {@link ClientCertificate} will be used.
 */
/**
 * Holds the Client TLS certificate information.
 *
 * Browser instances of the driver should configure the certificate
 * in the system.
 *
 * Files defined in the {@link ClientCertificate#certfile}
 * and {@link ClientCertificate#keyfile} will read and loaded to
 * memory to fill the fields `cert` and `key` in security context.
 *
 * @interface
 * @see https://nodejs.org/api/tls.html#tlscreatesecurecontextoptions
 * @since 5.27
 */
export default class ClientCertificate {
    readonly certfile: string | string[];
    readonly keyfile: KeyFile | KeyFile[];
    readonly password?: string;
    private constructor();
}
/**
 * Provides a client certificate to the driver for mutual TLS.
 *
 * The driver will call {@link ClientCertificateProvider#hasUpdate} to check if the client wants to update the certificate.
 * If so, it will call {@link ClientCertificateProvider#getClientCertificate} to get the new certificate.
 *
 * The certificate is only used as a second factor for authentication authenticating the client.
 * The DMBS user still needs to authenticate with an authentication token.
 *
 * All implementations of this interface must be thread-safe and non-blocking for caller threads.
 * For instance, IO operations must not be done on the calling thread.
 *
 * Note that the work done in the methods of this interface count towards the connectionAcquisition.
 * Should fetching the certificate be particularly slow, it might be necessary to increase the timeout.
 *
 * @interface
 * @since 5.27
 */
export declare class ClientCertificateProvider {
    /**
     * Indicates whether the client wants the driver to update the certificate.
     *
     * @returns {Promise<boolean>|boolean} true if the client wants the driver to update the certificate
     */
    hasUpdate(): boolean | Promise<boolean>;
    /**
     * Returns the certificate to use for new connections.
     *
     * Will be called by the driver after {@link ClientCertificateProvider#hasUpdate} returned true
     * or when the driver establishes the first connection.
     *
     * @returns {Promise<ClientCertificate>|ClientCertificate} the certificate to use for new connections
     */
    getClientCertificate(): ClientCertificate | Promise<ClientCertificate>;
}
/**
 * Interface for  {@link ClientCertificateProvider} which provides update certificate function.
 * @interface
 * @since 5.27
 */
export declare class RotatingClientCertificateProvider extends ClientCertificateProvider {
    /**
     * Updates the certificate stored in the provider.
     *
     * To be called by user-code when a new client certificate is available.
     *
     * @param {ClientCertificate} certificate - the new certificate
     * @throws {TypeError} If initialCertificate is not a ClientCertificate.
     */
    updateCertificate(certificate: ClientCertificate): void;
}
/**
 * Defines the object which holds the common {@link ClientCertificateProviders} used in the Driver
 *
 * @since 5.27
 */
declare class ClientCertificateProviders {
    /**
     *
     * @param {object} param0 - The params
     * @param {ClientCertificate} param0.initialCertificate - The certificated used by the driver until {@link RotatingClientCertificateProvider#updateCertificate} get called.
     *
     * @returns {RotatingClientCertificateProvider} The rotating client certificate provider
     * @throws {TypeError} If initialCertificate is not a ClientCertificate.
     */
    rotating({ initialCertificate }: {
        initialCertificate: ClientCertificate;
    }): RotatingClientCertificateProvider;
}
/**
 * Holds the common {@link ClientCertificateProviders} used in the Driver.
 *
 * @since 5.27
 */
declare const clientCertificateProviders: ClientCertificateProviders;
export { clientCertificateProviders };
export type { ClientCertificateProviders };
/**
 * Resolves ClientCertificate or ClientCertificateProvider to a ClientCertificateProvider
 *
 * Method validates the input.
 *
 * @private
 * @param input
 * @returns {ClientCertificateProvider?} A client certificate provider if provided a ClientCertificate or a ClientCertificateProvider
 * @throws {TypeError} If input is not a ClientCertificate, ClientCertificateProvider, undefined or null.
 */
export declare function resolveCertificateProvider(input: unknown): ClientCertificateProvider | undefined;
