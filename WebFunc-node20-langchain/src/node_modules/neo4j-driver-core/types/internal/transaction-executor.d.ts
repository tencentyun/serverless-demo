/// <reference types="node" />
import Transaction, { NonAutoCommitApiTelemetryConfig, NonAutoCommitTelemetryApis } from '../transaction';
import TransactionPromise from '../transaction-promise';
type TransactionCreator = (apiTransactionConfig?: NonAutoCommitApiTelemetryConfig) => TransactionPromise;
type TransactionWork<T, Tx = Transaction> = (tx: Tx) => T | Promise<T>;
type Resolve<T> = (value: T | PromiseLike<T>) => void;
type Reject = (value: any) => void;
type Timeout = ReturnType<typeof setTimeout>;
type SetTimeout = (callback: (...args: unknown[]) => void, ms: number | undefined, ...args: unknown[]) => Timeout;
type ClearTimeout = (timeoutId: Timeout) => void;
interface Dependencies {
    setTimeout: SetTimeout;
    clearTimeout: ClearTimeout;
}
interface ExecutionContext {
    apiTransactionConfig?: NonAutoCommitApiTelemetryConfig;
}
export declare class TransactionExecutor {
    private readonly _maxRetryTimeMs;
    private readonly _initialRetryDelayMs;
    private readonly _multiplier;
    private readonly _jitterFactor;
    private _inFlightTimeoutIds;
    private readonly _setTimeout;
    private readonly _clearTimeout;
    telemetryApi: NonAutoCommitTelemetryApis;
    pipelineBegin: boolean;
    constructor(maxRetryTimeMs?: number | null, initialRetryDelayMs?: number, multiplier?: number, jitterFactor?: number, dependencies?: Dependencies);
    execute<T, Tx = Transaction>(transactionCreator: TransactionCreator, transactionWork: TransactionWork<T, Tx>, transactionWrapper?: (tx: Transaction) => Tx): Promise<T>;
    close(): void;
    _retryTransactionPromise<T, Tx = Transaction>(transactionCreator: TransactionCreator, transactionWork: TransactionWork<T, Tx>, error: Error, retryStartTime: number, retryDelayMs: number, transactionWrapper?: (tx: Transaction) => Tx, executionContext?: ExecutionContext): Promise<T>;
    _executeTransactionInsidePromise<T, Tx = Transaction>(transactionCreator: TransactionCreator, transactionWork: TransactionWork<T, Tx>, resolve: Resolve<T>, reject: Reject, transactionWrapper?: (tx: Transaction) => Tx, executionContext?: ExecutionContext): Promise<void>;
    _safeExecuteTransactionWork<T, Tx = Transaction>(tx: Tx, transactionWork: TransactionWork<T, Tx>): Promise<T>;
    _handleTransactionWorkSuccess<T>(result: T, tx: Transaction | TransactionPromise, resolve: Resolve<T>, reject: Reject): void;
    _handleTransactionWorkFailure(error: any, tx: Transaction | TransactionPromise, reject: Reject): void;
    _computeDelayWithJitter(delayMs: number): number;
    _verifyAfterConstruction(): void;
}
export {};
