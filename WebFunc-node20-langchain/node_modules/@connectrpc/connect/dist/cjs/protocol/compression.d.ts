import { ConnectError } from "../connect-error.js";
/**
 * compressedFlag indicates that the data in a EnvelopedMessage is
 * compressed. It has the same meaning in the gRPC-Web, gRPC-HTTP2,
 * and Connect protocols.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare const compressedFlag = 1;
/**
 * Compression provides methods to compress and decompress data with
 * a certain compression algorithm.
 */
export interface Compression {
    /**
     * The name of the compression algorithm.
     */
    name: string;
    /**
     * Compress a chunk of data.
     */
    compress: (bytes: Uint8Array) => Promise<Uint8Array>;
    /**
     * Decompress a chunk of data.
     *
     * A zero-length chunk is acceptable, and will return a zero-length result.
     *
     * Raises a ConnectError with Code.InvalidArgument if the decompressed
     * size exceeds readMaxBytes.
     */
    decompress: (bytes: Uint8Array, readMaxBytes: number) => Promise<Uint8Array>;
}
/**
 * Validates the request encoding and determines the accepted response encoding.
 *
 * Returns the request and response compression to use. If the client requested
 * an encoding that is not available, the returned object contains an error that
 * must be used for the response.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function compressionNegotiate(available: Compression[], requested: string | null, // e.g. the value of the Grpc-Encoding header
accepted: string | null, // e.g. the value of the Grpc-Accept-Encoding header
headerNameAcceptEncoding: string): {
    request: Compression | null;
    response: Compression | null;
    error?: ConnectError;
};
