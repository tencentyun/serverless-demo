/**
 * In unary RPCs, Connect transports trailing metadata as response header
 * fields, prefixed with "trailer-".
 *
 * This function demuxes headers and trailers into two separate Headers
 * objects.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function trailerDemux(header: Headers): [header: Headers, trailer: Headers];
/**
 * In unary RPCs, Connect transports trailing metadata as response header
 * fields, prefixed with "trailer-".
 *
 * This function muxes a header and a trailer into a single Headers object.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function trailerMux(header: Headers, trailer: Headers): Headers;
