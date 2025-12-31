/**
 * CORS prevents rogue scripts in a web browser from making arbitrary requests
 * to other web servers.
 *
 * This object provides helpful constants to configure CORS middleware for
 * cross-domain requests with the protocols supported by Connect.
 *
 * Make sure to add application-specific headers that your application
 * uses as well.
 */
export declare const cors: {
    /**
     * Request methods that scripts running in the browser are permitted to use.
     *
     * To support cross-domain requests with the protocols supported by Connect,
     * these headers fields must be included in the preflight response header
     * Access-Control-Allow-Methods.
     */
    allowedMethods: ReadonlyArray<string>;
    /**
     * Header fields that scripts running in the browser are permitted to send.
     *
     * To support cross-domain requests with the protocols supported by Connect,
     * these field names must be included in the preflight response header
     * Access-Control-Allow-Headers.
     *
     * Make sure to include any application-specific headers your browser client
     * may send.
     */
    allowedHeaders: ReadonlyArray<string>;
    /**
     * Header fields that scripts running the browser are permitted to see.
     *
     * To support cross-domain requests with the protocols supported by Connect,
     * these field names must be included in header Access-Control-Expose-Headers
     * of the actual response.
     *
     * Make sure to include any application-specific headers your browser client
     * should see. If your application uses trailers, they will be sent as header
     * fields with a `Trailer-` prefix for Connect unary RPCs - make sure to
     * expose them as well if you want them to be visible in all supported
     * protocols.
     */
    exposedHeaders: ReadonlyArray<string>;
};
