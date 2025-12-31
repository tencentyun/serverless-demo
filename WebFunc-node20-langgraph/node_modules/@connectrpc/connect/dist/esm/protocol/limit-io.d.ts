/**
 * Asserts that the options writeMaxBytes, readMaxBytes, and compressMinBytes
 * are within sane limits, and returns default values where no value is
 * provided.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function validateReadWriteMaxBytes(readMaxBytes: number | undefined, writeMaxBytes: number | undefined, compressMinBytes: number | undefined): {
    readMaxBytes: number;
    writeMaxBytes: number;
    compressMinBytes: number;
};
/**
 * Raise an error ResourceExhausted if more than writeMaxByte are written.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function assertWriteMaxBytes(writeMaxBytes: number, bytesWritten: number): void;
/**
 * Raise an error ResourceExhausted if more than readMaxBytes are read.
 *
 * @private Internal code, does not follow semantic versioning.
 */
export declare function assertReadMaxBytes(readMaxBytes: number, bytesRead: number, totalSizeKnown?: boolean): void;
