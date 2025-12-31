/**
 * The only know value for the header Connect-Protocol-Version.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const protocolVersion = "1";
/**
 * Requires the Connect-Protocol-Version header to be present with the expected
 * value. Raises a ConnectError with Code.InvalidArgument otherwise.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function requireProtocolVersionHeader(requestHeader: Headers): void;
/**
 * Requires the connect query parameter to be present with the expected value.
 * Raises a ConnectError with Code.InvalidArgument otherwise.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function requireProtocolVersionParam(queryParams: URLSearchParams): void;
